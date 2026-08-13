/* pendulum.js — Topknot, the implementation.
 *
 * Everything lives here rather than in extension.js so that it can be reloaded
 * without ending your session: extension.js is a stable shim that imports this
 * file from a fresh path on each enable. See the comment there for why.
 *
 * A charm hangs from the top edge of the screen on a cord, over the desktop.
 * It is a pendulum: it swings in a breeze, you can grab it and flick it, and
 * you can drag its hook along the top edge to re-hang it anywhere.
 *
 * It has to be a shell extension rather than an ordinary app because of one
 * requirement — the charm is drawn above every window but only the charm itself
 * takes clicks. On Wayland an ordinary client cannot do that. Inside the
 * compositor it is two lines: chrome with affectsInputRegion:false for the
 * artwork, and a small tracked hit area for the part you can actually grab.
 */

import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {CHARMS, charmById, buildCharm, playRitual} from './charms.js';

const DBUS_PATH = '/org/gnome/shell/extensions/topknot';
const DBUS_IFACE = `
<node>
  <interface name="org.gnome.Shell.Extensions.Topknot">
    <method name="Bless">
      <arg type="s" name="message" direction="in"/>
    </method>
    <method name="Flick">
      <arg type="d" name="strength" direction="in"/>
    </method>
    <method name="SetCharm">
      <arg type="s" name="charm" direction="in"/>
    </method>
    <method name="ListCharms">
      <arg type="as" name="charms" direction="out"/>
    </method>
    <method name="Toggle"/>
    <method name="OpenMenu"/>
    <property name="DragState" type="s" access="read"/>
    <property name="MenuOpen" type="b" access="read"/>
    <property name="BlessCount" type="i" access="read"/>
  </interface>
</node>`;

const SPARKLES = ['✨', '✦', '·', '✧'];

/* Pendulum constants, in pixels and seconds. GRAVITY is tuned by eye rather
 * than by physics: real g at screen scale swings far too slowly to read as a
 * small object on a short string.
 *
 * Sign convention: θ is the angle from straight down, positive when the charm
 * is to the RIGHT. Clutter's rotation_angle_z turns the other way — measured,
 * not assumed: a child hanging below the pivot moves LEFT for a positive angle
 * — so rendering negates θ. Everything else in this file can then think in the
 * direction a hand actually moves. */
const GRAVITY = 2600;
/* Radians. Dragging may haul the charm up near horizontal, but left to itself
 * it must never swing that far: the whole charm rotates with the cord, and past
 * about 60 degrees a hanging object reads as broken rather than swinging — it
 * ends up lying on its side. Verified by looking at it. */
const MAX_SWING = 1.5;       // hard limit, only reachable by dragging
const FREE_SWING = 1.05;     // limit under its own momentum
const FLICK_CAP = 6.5;       // radians/sec; higher just pins it at the limit
const BREEZE = [
    {amp: 2.1, period: 6.7, phase: 0},
    {amp: 1.3, period: 10.9, phase: 1.3},
    {amp: 0.7, period: 17.3, phase: 2.6},
];

/* The cord is elastic, which is most of what separates a string from a rod.
 * STRETCH_K/C are a stiff, well-damped spring: pulling stretches the cord,
 * letting go snaps it back with one small recoil. SLACK is how far it may go
 * shorter than rest — a real cord bunches rather than pushing, so only a little.
 * CENTRIFUGAL lets a fast swing visibly draw the cord out. */
const STRETCH_K = 150;
const STRETCH_C = 11;
const SLACK = 0.18;          // fraction of rest length
const CENTRIFUGAL = 0.06;
const RETURN_SPEED = 2600;   // px/sec ceiling on the cord snapping back

/* The charm hangs *from* the cord, so it lags and whips rather than being
 * welded to it. A second, looser spring drives that. */
const LAG_K = 95;
const LAG_C = 8.5;
const MAX_LAG = 0.55;        // radians of lead or lag

/* How far the cord is drawn past the top of the charm's box, as a fraction of
 * the charm size. Every charm's artwork starts some way down its own 128px
 * canvas — measured, the deepest is the horseshoe at 0.094 — so a cord that
 * stops at the box edge visibly fails to reach the charm and the whole thing
 * looks detached. The charm is painted over the overlap. */
const CORD_OVERLAP = 0.13;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

class Pendulum {
    constructor(ext) {
        this._ext = ext;
        this._settings = ext.getSettings();

        // Pendulum state: angle from straight down (positive = charm to the
        // right), and its rate of change.
        this._theta = 0.12;
        this._omega = 0;
        this._time = 0;
        this._lastFrame = GLib.get_monotonic_time();

        // Cord stretch, and the charm's own angle as it lags behind the cord.
        this._stretch = 0;
        this._stretchVel = 0;
        this._lag = this._theta;
        this._lagVel = 0;
        this._swingCeiling = FREE_SWING;

        // How far the cord has paid out beyond its resting length. A bless
        // lowers the charm; this eases back to zero afterwards.
        this._drop = 0;
        this._dropTarget = 0;

        this._destroyed = false;
        this._clockId = 0;
        this._blocked = false;
        this._overview = false;
        this._dragging = false;
        this._rehanging = false;
        this._blessing = false;
        this._motionCount = 0;
        this._dragIds = [];
        this._retreatId = 0;
        this._captureId = 0;
        this._signals = [];

        this._buildChrome();
        this._buildCharm();
        this._syncGeometry();
        this._syncVisible();
        this._startClock();

        for (const key of ['charm', 'emoji'])
            this._watch(key, () => this._buildCharm());
        for (const key of ['charm-size', 'cord-length', 'anchor'])
            this._watch(key, () => { this._buildCharm(); this._syncGeometry(); });
        this._watch('visible', () => this._syncVisible());

        this._monitorsId = Main.layoutManager.connect('monitors-changed',
            () => this._syncGeometry());
    }

    _watch(key, fn) {
        this._signals.push([this._settings, this._settings.connect(`changed::${key}`, fn)]);
    }

    /* ------------------------------------------------------------ structure */

    _buildChrome() {
        const layout = () => new Clutter.FixedLayout();

        // Everything the eye sees. Never takes input.
        this._layer = new St.Widget({layout_manager: layout(), reactive: false});
        Main.layoutManager.addTopChrome(this._layer, {
            affectsInputRegion: false,
            affectsStruts: false,
            trackFullscreen: true,
        });

        // The hook it hangs from, flush under the top bar.
        this._hook = new St.Widget({style_class: 'topknot-hook'});
        this._layer.add_child(this._hook);

        // Cord and charm rotate together about the hook.
        this._pendulum = new St.Widget({layout_manager: layout(), reactive: false});
        this._pendulum.set_pivot_point(0.5, 0);
        this._layer.add_child(this._pendulum);

        this._cord = new St.Widget({style_class: 'topknot-cord'});
        this._pendulum.add_child(this._cord);

        this._charmBin = new St.Widget({
            layout_manager: new Clutter.BinLayout(),
            reactive: false,
        });
        // Pivots where the cord meets it, so the charm's lag reads as swinging
        // from the cord end rather than spinning about its own middle.
        this._charmBin.set_pivot_point(0.5, 0);
        this._pendulum.add_child(this._charmBin);

        // The only two rectangles on the screen that take a click: the charm
        // and its hook. Tracked separately from the artwork so the input region
        // stays as small as possible — see _followHitArea for how it keeps up
        // with the swing without recomputing that region every frame.
        this._hitCharm = this._makeHitArea();
        this._hitHook = this._makeHitArea();

        this._connect(this._hitCharm, 'button-press-event',
            (a, e) => this._onPress(e, false));
        this._connect(this._hitHook, 'button-press-event',
            (a, e) => this._onPress(e, true));
        // No scroll handler on purpose. The grabbable area is invisible and
        // sits over other windows, so swallowing scroll there would stop the
        // page underneath from scrolling — a nudge is not worth that.
    }

    _makeHitArea() {
        const area = new St.Widget({reactive: true});
        this._layer.add_child(area);
        Main.layoutManager.trackChrome(area, {affectsInputRegion: true});
        return area;
    }

    _connect(actor, signal, fn) {
        this._signals.push([actor, actor.connect(signal, fn)]);
    }

    _buildCharm() {
        const def = charmById(this._settings.get_string('charm'));
        const size = this._settings.get_int('charm-size');

        this._charmBin.destroy_all_children();
        this._charm = buildCharm(def, size, this._ext.path,
            this._settings.get_string('emoji'));
        this._charmBin.add_child(this._charm.actor);
        this._applyDaruma();

        if (this._menu) {
            this._menu.destroy();
            this._menu = null;
        }
    }

    _applyDaruma() {
        if (this._charm?.def.id !== 'daruma')
            return;
        const state = this._settings.get_int('daruma-state');
        this._charm.parts.eyeL.opacity = state >= 1 ? 255 : 0;
        this._charm.parts.eyeR.opacity = state >= 2 ? 255 : 0;
    }

    /** Recompute every position from settings and the monitor geometry. */
    _syncGeometry() {
        const mon = Main.layoutManager.primaryMonitor;
        if (!mon)
            return;

        this._mon = mon;
        this._size = this._settings.get_int('charm-size');
        this._cordLen = this._settings.get_int('cord-length');

        this._layer.set_position(mon.x, mon.y);
        this._layer.set_size(mon.width, mon.height);

        const margin = this._size * 0.7;
        this._anchorX = clamp(this._settings.get_double('anchor') * mon.width,
            margin, Math.max(margin, mon.width - margin));
        this._anchorY = Main.panel.height;

        this._hook.set_size(14, 6);
        this._hook.set_position(Math.round(this._anchorX - 7), this._anchorY - 1);

        this._layoutPendulum();
        this._placeHitAreas();
    }

    /** The parts that move when the cord pays out. Cheap; runs every frame. */
    _layoutPendulum() {
        const size = this._size;
        const cord = Math.max(2, this._cordLen + this._drop + this._stretch);

        this._pendulum.set_position(Math.round(this._anchorX - size / 2), this._anchorY);
        this._pendulum.set_size(size, cord + size);

        // Drawn past the charm box and painted over; see CORD_OVERLAP. This
        // does not change the pendulum length, only what is drawn.
        this._cord.set_position(Math.round(size / 2 - 2), 0);
        this._cord.set_size(4, Math.round(cord + size * CORD_OVERLAP));

        this._charmBin.set_position(0, Math.round(cord));
        this._charmBin.set_size(size, size);
    }

    /** Where the charm's centre actually is right now, in layer coordinates. */
    _charmCentre() {
        const L = this._cordLen + this._drop + this._stretch + this._size / 2;
        return [
            this._anchorX + L * Math.sin(this._theta),
            this._anchorY + L * Math.cos(this._theta),
        ];
    }

    _placeHitAreas() {
        // Kept to the charm's visible mass rather than its full box: this is
        // the only part of the screen that stops being click-through, and it
        // sits right under the top bar, over window titlebars and tab strips.
        const grab = this._size * 0.66;
        const [cx, cy] = this._charmCentre();

        // Never let the grabbable box ride up into the top bar. Swung near
        // horizontal the charm's centre climbs to roughly the panel's height,
        // and the box would then cover part of the bar and steal its clicks.
        const top = Math.max(this._anchorY, cy - grab / 2);

        this._hitCharm.set_size(Math.round(grab), Math.round(grab));
        this._hitCharm.set_position(Math.round(cx - grab / 2), Math.round(top));

        this._hitHook.set_size(30, 24);
        this._hitHook.set_position(Math.round(this._anchorX - 15), this._anchorY);

        this._hitAt = [cx, cy];
    }

    /* The grabbable area follows the charm, but only once it has actually gone
     * somewhere. Moving a tracked actor recomputes the compositor's input
     * region, and the charm never stops moving — so chasing it every frame
     * would mean recomputing forever. A distance threshold makes a gentle sway
     * cost a couple of updates per cycle and a hard flick a brief burst. */
    _followHitArea() {
        if (this._dragging)
            return;
        const [cx, cy] = this._charmCentre();
        const [hx, hy] = this._hitAt ?? [cx, cy];
        if (Math.hypot(cx - hx, cy - hy) > 8)
            this._placeHitAreas();
    }

    /* Taking the charm down leaves the bare hook behind, and the hook stays
     * clickable. There is no panel icon, so hiding everything would leave no
     * way back except a shortcut you may not remember. */
    _syncVisible() {
        const visible = this._settings.get_boolean('visible');

        if (visible)
            this._hook.remove_style_class_name('topknot-hook-empty');
        else
            this._hook.add_style_class_name('topknot-hook-empty');

        this._applyInput();
    }

    /* The charm is an ornament on the desktop, so it must never sit in front of
     * the shell's own UI. It is drawn as top chrome, which puts its grabbable
     * box above panel menus, the overview and any modal — so a click meant for
     * the system menu or a dock item would land on the charm instead. Whenever
     * the shell is showing something of its own, the charm stops taking input,
     * and in the overview it gets out of the way entirely. */
    _updateShellState() {
        const overview = Main.overview.visible;
        const menu = Main.panel.menuManager?.activeMenu != null;
        const modal = (Main.modalCount ?? 0) > 0;

        /* Our own menu must not count. It pushes a modal, which would mark the
         * charm blocked, which hides the hit areas — and a PopupMenu closes as
         * soon as its source actor is unmapped. The menu would open and vanish
         * in the same frame, so right-click appeared to do nothing at all. */
        const ours = (this._menu?.isOpen ?? false) || this._dragging;
        const blocked = !ours && (overview || menu || modal);

        if (blocked === this._blocked && overview === this._overview)
            return;
        this._blocked = blocked;
        this._overview = overview;
        this._applyInput();
    }

    /* Single owner of every visibility decision here.
     *
     * Deliberately does NOT touch _layer.visible: the chrome layer was added
     * with trackFullscreen, so GNOME's LayoutManager sets that property
     * itself. Two owners for one property means whichever writes last wins,
     * which is a race even when it happens to work. Hide the contents. */
    _applyInput() {
        const hanging = this._settings.get_boolean('visible');

        this._pendulum.visible = hanging && !this._overview;
        this._hook.visible = !this._overview;
        this._hitCharm.visible = hanging && !this._blocked;
        this._hitHook.visible = !this._blocked;
    }

    /* --------------------------------------------------------------- physics */

    _startClock() {
        this._clock = Clutter.Timeline.new_for_actor(this._layer, 1000);
        this._clock.set_repeat_count(-1);
        this._clockId = this._clock.connect('new-frame', () => this._tick());
        this._clock.start();
    }

    /* A frame callback that throws does it sixty times a second, forever, and
     * a storm of exceptions inside the compositor's frame dispatch will take
     * the rest of the shell down with it — the overview and the Show
     * Applications button stop responding. So a tick that fails stops the
     * clock and reports once, instead of screaming. */
    _tick() {
        if (this._destroyed)
            return;
        try {
            this._tickOnce();
        } catch (e) {
            this._destroyed = true;
            this._clock?.stop();
            console.error(`Topknot: animation stopped after an error — ${e}`);
        }
    }

    _tickOnce() {
        const now = GLib.get_monotonic_time();
        // Clamp dt so a stalled compositor cannot fling the charm off-screen.
        const dt = clamp((now - this._lastFrame) / 1e6, 0, 0.05);
        this._lastFrame = now;

        /* Runs first, and unconditionally. This is the call that brings the
         * charm back when the overview closes, so it must not sit behind an
         * early return that tests the very visibility it controls — that
         * deadlocks: the layer hides, the tick bails, and nothing ever
         * un-hides it. */
        this._updateShellState();

        if (dt === 0 || this._overview || !this._pendulum.visible)
            return;

        this._time += dt;

        /* If a button-release ever goes astray — another actor takes the grab,
         * a modal opens, the pointer leaves the compositor — the drag would
         * never end, and the charm would follow the pointer around the screen
         * swallowing every motion event. Check the button is still physically
         * down rather than trusting the event stream. */
        if (this._dragging && this._time - this._pressTime > 0.15) {
            const [, , mods] = global.get_pointer();
            if (!(mods & Clutter.ModifierType.BUTTON1_MASK))
                this._endDrag();
        }

        // The cord eases toward its target length rather than being tweened, so
        // the pendulum length stays consistent with what is drawn.
        if (Math.abs(this._dropTarget - this._drop) > 0.5) {
            this._drop += (this._dropTarget - this._drop) * Math.min(1, dt * 7);
            this._layoutPendulum();
        }

        const L = Math.max(20,
            this._cordLen + this._drop + this._stretch + this._size / 2);

        if (!this._dragging) {
            const damping = this._settings.get_double('damping');
            let force = -(GRAVITY / L) * Math.sin(this._theta) - damping * this._omega;

            // A breeze, built from periods that do not divide into each other,
            // so the motion never visibly loops.
            if (this._settings.get_boolean('sway')) {
                const live = this._settings.get_double('liveliness');
                for (const b of BREEZE) {
                    force += live * b.amp *
                        Math.sin(2 * Math.PI * this._time / b.period + b.phase);
                }
            }

            this._omega = clamp(this._omega + force * dt, -FLICK_CAP, FLICK_CAP);

            /* The swing ceiling starts wherever the charm was let go and only
             * ever tightens, back down to the free-swing limit.
             *
             * It must not be recomputed from the current angle each frame: that
             * makes the ceiling equal to the angle, so the "hit the limit"
             * test is true on the very first frame after release and the bounce
             * fires immediately, throwing away most of the momentum. Pull the
             * charm out and let go, and it sags instead of swinging. */
            const ceiling = this._swingCeiling;
            const next = this._theta + this._omega * dt;
            if (Math.abs(next) > ceiling) {
                this._theta = Math.sign(next) * ceiling;
                this._omega *= -0.3;    // stop dead rather than tunnel through
            } else {
                this._theta = next;
            }
            this._swingCeiling = Math.max(FREE_SWING,
                Math.min(ceiling, Math.abs(this._theta)));

            // The cord springs back to rest, drawn out a little by the swing.
            // Centrifugal pull is capped: with a long cord and a fast swing it
            // would otherwise overwhelm the spring and hold the charm extended.
            const pull = Math.min(CENTRIFUGAL * this._omega * this._omega * L, 500);
            const acc = -STRETCH_K * this._stretch - STRETCH_C * this._stretchVel + pull;
            // Capped too: released from a long pull the spring accelerates hard
            // enough to look like a catapult rather than a cord.
            this._stretchVel = clamp(this._stretchVel + acc * dt,
                -RETURN_SPEED, RETURN_SPEED);
            this._stretch = Math.max(this._stretch + this._stretchVel * dt,
                -this._cordLen * SLACK);
            if (this._stretch <= -this._cordLen * SLACK && this._stretchVel < 0)
                this._stretchVel = 0;    // cord bunches; it does not push back

            // Only re-lay-out while the cord is actually changing length; at
            // rest this is every frame for nothing.
            if (Math.abs(this._stretch) > 0.3 || Math.abs(this._stretchVel) > 0.3)
                this._layoutPendulum();
        }

        // The charm swings from the end of the cord, so it leads and trails
        // rather than being welded on. This runs while dragging too — it is
        // what makes a flick whip.
        const lagAcc = -LAG_K * (this._lag - this._theta) - LAG_C * this._lagVel;
        this._lagVel += lagAcc * dt;
        this._lag += this._lagVel * dt;
        const lag = clamp(this._lag - this._theta, -MAX_LAG, MAX_LAG);

        // Negated: Clutter turns the opposite way to our sign convention.
        this._pendulum.rotation_angle_z = -this._theta * 180 / Math.PI;
        this._charmBin.rotation_angle_z = -lag * 180 / Math.PI;

        this._followHitArea();
    }

    /* ------------------------------------------------------------ the hands */

    _onPress(event, onHook) {
        const button = event.get_button();

        if (button === Clutter.BUTTON_SECONDARY) {
            this._openMenu();
            return Clutter.EVENT_STOP;
        }
        if (button === Clutter.BUTTON_MIDDLE) {
            this.bless();
            return Clutter.EVENT_STOP;
        }
        if (button !== Clutter.BUTTON_PRIMARY)
            return Clutter.EVENT_PROPAGATE;

        // Clicking the bare hook hangs the charm back up.
        if (!this._settings.get_boolean('visible')) {
            this._settings.set_boolean('visible', true);
            this.flick(2.5);
            return Clutter.EVENT_STOP;
        }

        // The hook re-hangs it; the charm itself swings. Ctrl is an escape
        // hatch for anyone who never discovers the hook.
        const ctrl = (event.get_state() & Clutter.ModifierType.CONTROL_MASK) !== 0;
        this._rehanging = onHook || ctrl;
        this._dragging = true;
        this._dragMoved = false;
        this._pressTime = this._time;
        this._lastTheta = this._theta;
        this._lastSample = GLib.get_monotonic_time();

        this._grab = this._takeGrab();

        /* Listen on the grabbed actor, not just the stage. A Clutter grab
         * delivers events to the grab actor's subtree, so the stage's
         * captured-event stops firing entirely — which is how the first
         * attempt at this failed: the grab was taken successfully and the
         * drag still froze, because nothing was listening where the events
         * were being sent. The stage handler is kept as a fallback for the
         * case where no grab could be taken at all. */
        this._dragIds = [
            this._hitCharm.connect('motion-event', (a, e) => this._onCaptured(e)),
            this._hitCharm.connect('button-release-event', (a, e) => this._onCaptured(e)),
            this._hitCharm.connect('touch-event', (a, e) => this._onCaptured(e)),
        ];
        this._captureId = global.stage.connect('captured-event',
            (a, e) => this._onCaptured(e));
        return Clutter.EVENT_STOP;
    }

    /* Hold the pointer for the length of the drag.
     *
     * The charm's hit area is small, and a drag immediately leaves it and
     * travels over ordinary windows. On Wayland those motion events go to the
     * application under the pointer, not to the shell, so without a grab the
     * drag goes deaf: dragging stays true while the angle and stretch freeze at
     * whatever they were when the pointer crossed the edge. Measured on a real
     * drag — the charm sat still while the pointer ran 400px away from it. */
    _takeGrab() {
        try {
            if (typeof global.stage.grab === 'function')
                return {kind: 'stage', grab: global.stage.grab(this._hitCharm)};
        } catch (e) {
            console.error(`Topknot: stage grab unavailable — ${e}`);
        }
        try {
            if (Main.pushModal(this._hitCharm, {actionMode: Shell.ActionMode.NORMAL}))
                return {kind: 'modal'};
        } catch (e) {
            console.error(`Topknot: modal grab unavailable — ${e}`);
        }
        return {kind: 'none'};
    }

    _releaseGrab() {
        const held = this._grab;
        this._grab = null;
        if (!held)
            return;
        try {
            if (held.kind === 'stage')
                held.grab.dismiss();
            else if (held.kind === 'modal')
                Main.popModal(this._hitCharm);
        } catch (e) {
            console.error(`Topknot: releasing the grab — ${e}`);
        }
    }

    _onCaptured(event) {
        const type = event.type();

        if (type === Clutter.EventType.MOTION ||
            type === Clutter.EventType.TOUCH_UPDATE) {
            const [px, py] = global.get_pointer();
            this._dragMoved = true;
            this._motionCount = (this._motionCount ?? 0) + 1;

            if (this._rehanging) {
                const frac = clamp((px - this._mon.x) / this._mon.width, 0, 1);
                this._settings.set_double('anchor', frac);
                this._syncGeometry();
            } else {
                // The charm follows the pointer in both angle AND distance, so
                // pulling away stretches the cord instead of sliding the charm
                // along a fixed arc. That difference is most of what makes it
                // read as a string rather than a rod on a hinge.
                const dx = px - (this._mon.x + this._anchorX);
                const dy = py - (this._mon.y + this._anchorY);
                const theta = clamp(Math.atan2(dx, Math.max(1, dy)),
                    -MAX_SWING, MAX_SWING);

                const rest = this._cordLen + this._drop;
                const reach = Math.hypot(dx, dy) - this._size / 2;
                const stretch = this._rubberBand(reach - rest);

                // Track both velocities so releasing mid-swipe throws it and
                // lets the cord snap back.
                const now = GLib.get_monotonic_time();
                const dt = (now - this._lastSample) / 1e6;
                if (dt > 0.004) {
                    this._omega = clamp((theta - this._lastTheta) / dt,
                        -FLICK_CAP, FLICK_CAP);
                    this._stretchVel = (stretch - this._stretch) / dt;
                    this._lastTheta = theta;
                    this._lastSample = now;
                }
                this._theta = theta;
                this._stretch = stretch;
                this._layoutPendulum();
                this._pendulum.rotation_angle_z = -theta * 180 / Math.PI;
            }
            return Clutter.EVENT_STOP;
        }

        if (type === Clutter.EventType.BUTTON_RELEASE ||
            type === Clutter.EventType.TOUCH_END) {
            this._endDrag();
            return Clutter.EVENT_STOP;
        }

        return Clutter.EVENT_PROPAGATE;
    }

    _endDrag() {
        if (this._captureId) {
            global.stage.disconnect(this._captureId);
            this._captureId = 0;
        }
        for (const id of this._dragIds ?? []) {
            try {
                this._hitCharm.disconnect(id);
            } catch {
                // actor may already be gone
            }
        }
        this._dragIds = [];
        this._releaseGrab();
        const wasRehanging = this._rehanging;
        this._dragging = false;
        this._rehanging = false;

        /* Release with full headroom, not with the ceiling set to exactly where
         * the charm happens to be — let go while still pulling outward and it
         * would be at its own limit on the first frame, bounce, and lose most
         * of its momentum. The ceiling tightens on its own as it swings down. */
        this._swingCeiling = MAX_SWING;

        if (wasRehanging) {
            this._placeHitAreas();
            return;
        }
        // A press that never moved is a click: perform the ritual.
        if (!this._dragMoved)
            this.bless();
        else
            this._placeHitAreas();
    }


    /* How far the cord gives when pulled.
     *
     * It tracks the hand one-to-one across most of the screen, and only past
     * that does it start to resist — and even then it keeps following, just
     * more slowly. A hard cap is what a previous version had, and it felt
     * broken: the charm stopped dead 234px from the anchor while the cursor
     * carried on without it. A string should always come with your hand; it
     * should just get harder to pull.
     */
    _softStretch() {
        return Math.max((this._mon?.height ?? 900) * 0.55,
            this._cordLen * 6 + this._size * 2);
    }

    _rubberBand(raw) {
        const floor = -this._cordLen * SLACK;      // a cord bunches, it does not push
        if (raw <= floor)
            return floor;
        const soft = this._softStretch();
        if (raw <= soft)
            return raw;
        return soft + (raw - soft) * 0.3;
    }

    flick(strength = 2.5) {
        this._omega = clamp(this._omega + strength, -FLICK_CAP, FLICK_CAP);
    }

    /* -------------------------------------------------------------- rituals */

    /** Call it down: the cord pays out, the ritual plays, the cord draws back. */
    bless() {
        if (this._blessing)
            return;
        if (!this._settings.get_boolean('visible'))
            this._settings.set_boolean('visible', true);

        this._blessing = true;
        this._settings.set_int('bless-count',
            this._settings.get_int('bless-count') + 1);

        this._dropTarget = Math.round(this._size * 1.15);
        this.flick(this._theta >= 0 ? 1.6 : -1.6);

        const dwell = playRitual(this._charm, {
            darumaState: this._settings.get_int('daruma-state'),
            onDarumaAdvance: next => this._settings.set_int('daruma-state', next),
            sparkle: n => this._sparkle(n),
        });

        this._retreatId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, dwell + 700, () => {
            this._retreatId = 0;
            this._dropTarget = 0;
            this._blessing = false;
            this._applyDaruma();
            // Let the cord finish drawing in before the hit area follows it.
            this._settleId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
                this._settleId = 0;
                this._placeHitAreas();
                return GLib.SOURCE_REMOVE;
            });
            return GLib.SOURCE_REMOVE;
        });
    }

    _sparkle(count) {
        const size = this._size;
        const [cx, cy] = this._charmBin.get_transformed_position();

        for (let i = 0; i < count; i++) {
            const label = new St.Label({
                text: SPARKLES[i % SPARKLES.length],
                style_class: 'topknot-sparkle',
                style: `font-size: ${Math.round(size * (0.13 + Math.random() * 0.12))}px;`,
                reactive: false,
            });
            const angle = (i / count) * 2 * Math.PI + Math.random();
            const radius = size * (0.4 + Math.random() * 0.3);
            label.set_position(
                Math.round(cx - this._mon.x + size / 2 + Math.cos(angle) * radius),
                Math.round(cy - this._mon.y + size / 2 + Math.sin(angle) * radius));
            label.opacity = 0;
            this._layer.add_child(label);

            label.ease({
                opacity: 255,
                duration: 180,
                delay: i * 55,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                onComplete: () => label.ease({
                    translation_y: -size * 0.45,
                    opacity: 0,
                    duration: 750,
                    mode: Clutter.AnimationMode.EASE_IN_QUAD,
                    onComplete: () => label.destroy(),
                }),
            });
        }
    }

    /* ----------------------------------------------------------------- menu */

    _openMenu() {
        if (!this._menu)
            this._buildMenu();
        this._refreshMenu();
        this._menu.toggle();
    }

    _buildMenu() {
        this._menu = new PopupMenu.PopupMenu(this._hitHook, 0.5, St.Side.TOP);
        this._menu.actor.add_style_class_name('topknot-menu');
        Main.layoutManager.uiGroup.add_child(this._menu.actor);
        this._menu.actor.hide();

        if (!this._menuManager)
            this._menuManager = new PopupMenu.PopupMenuManager(this._hitHook);
        this._menuManager.addMenu(this._menu);

        this._charmItems = new Map();
        for (const def of CHARMS) {
            const item = new PopupMenu.PopupMenuItem(def.name);
            item.add_child(new St.Label({
                text: def.origin,
                style_class: 'topknot-origin',
                x_align: Clutter.ActorAlign.END,
                x_expand: true,
                y_align: Clutter.ActorAlign.CENTER,
            }));
            item.connect('activate', () => {
                this._settings.set_string('charm', def.id);
                this.flick(2.4);
            });
            this._menu.addMenuItem(item);
            this._charmItems.set(def.id, item);
        }

        this._menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        const story = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false,
            style_class: 'topknot-story-item',
        });
        this._storyLabel = new St.Label({style_class: 'topknot-story'});
        this._storyLabel.clutter_text.line_wrap = true;
        story.add_child(this._storyLabel);
        this._menu.addMenuItem(story);

        this._menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this._ritualItem = new PopupMenu.PopupMenuItem('Bless me');
        this._ritualItem.connect('activate', () => this.bless());
        this._menu.addMenuItem(this._ritualItem);

        this._swayItem = new PopupMenu.PopupSwitchMenuItem('Breeze',
            this._settings.get_boolean('sway'));
        this._swayItem.connect('toggled', (_i, state) =>
            this._settings.set_boolean('sway', state));
        this._menu.addMenuItem(this._swayItem);

        const takeDown = new PopupMenu.PopupMenuItem('Take it down');
        takeDown.connect('activate', () => {
            this._settings.set_boolean('visible', false);
            Main.notify('Topknot',
                'Click the hook under the top bar to hang it up again.');
        });
        this._menu.addMenuItem(takeDown);

        const prefs = new PopupMenu.PopupMenuItem('Charm settings');
        prefs.connect('activate', () => this._ext.openPreferences());
        this._menu.addMenuItem(prefs);
    }

    _refreshMenu() {
        const def = charmById(this._settings.get_string('charm'));
        for (const [id, item] of this._charmItems) {
            item.setOrnament(id === def.id
                ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
        }
        const count = this._settings.get_int('bless-count');
        this._storyLabel.text = `${def.story}\n\n` + (count === 0
            ? 'Not yet called down.'
            : `Called down ${count} time${count === 1 ? '' : 's'}.`);
        this._ritualItem.label.text = def.ritual;
        this._swayItem.setToggleState(this._settings.get_boolean('sway'));
    }

    /* ---------------------------------------------------------------- close */

    destroy() {
        /* Order matters. The clock must be dead before anything it touches is
         * disposed: a single step below throwing used to abort the rest of
         * teardown, leaving a timeline running over destroyed actors for the
         * lifetime of the session. Each step is therefore independent. */
        this._destroyed = true;
        if (this._clock) {
            try {
                if (this._clockId)
                    this._clock.disconnect(this._clockId);
                this._clock.stop();
            } catch (e) {
                console.error(`Topknot: could not stop the clock — ${e}`);
            }
            this._clockId = 0;
            this._clock = null;
        }

        for (const id of ['_retreatId', '_settleId']) {
            if (this[id]) {
                GLib.Source.remove(this[id]);
                this[id] = 0;
            }
        }
        if (this._captureId) {
            global.stage.disconnect(this._captureId);
            this._captureId = 0;
        }
        for (const id of this._dragIds ?? []) {
            try {
                this._hitCharm.disconnect(id);
            } catch {
                // already gone
            }
        }
        this._dragIds = [];
        this._releaseGrab();
        if (this._monitorsId) {
            Main.layoutManager.disconnect(this._monitorsId);
            this._monitorsId = 0;
        }
        for (const [obj, id] of this._signals) {
            try {
                obj.disconnect(id);
            } catch {
                // the object may already be gone; keep tearing down
            }
        }
        this._signals = [];

        this._menu?.destroy();
        this._menu = null;
        this._menuManager = null;

        for (const area of [this._hitCharm, this._hitHook]) {
            try {
                Main.layoutManager.untrackChrome(area);
                area.destroy();
            } catch (e) {
                console.error(`Topknot: hit area teardown — ${e}`);
            }
        }
        try {
            Main.layoutManager.removeChrome(this._layer);
            this._layer.destroy();
        } catch (e) {
            console.error(`Topknot: layer teardown — ${e}`);
        }
        this._layer = null;
    }
}

export default class Topknot {
    /** @param {Extension} ext the shim, for path/settings/openPreferences */
    constructor(ext) {
        this._ext = ext;
    }

    enable() {
        this._settings = this._ext.getSettings();
        this._charm = new Pendulum(this._ext);

        this._dbus = Gio.DBusExportedObject.wrapJSObject(DBUS_IFACE, this);
        this._dbus.export(Gio.DBus.session, DBUS_PATH);

        this._bind('bless-shortcut', () => this._charm?.bless());
        this._bind('toggle-shortcut', () => this.Toggle());
    }

    disable() {
        for (const key of ['bless-shortcut', 'toggle-shortcut'])
            this._unbind(key);
        for (const id of this._rebindIds ?? [])
            this._settings.disconnect(id);
        this._rebindIds = [];

        this._dbus?.unexport();
        this._dbus = null;

        this._charm?.destroy();
        this._charm = null;
        this._settings = null;
    }

    /* The watch is connected once here, not inside _rebind — connecting it from
     * the handler it installs would add a fresh handler on every shortcut
     * change, and the callback would fire once per past edit. */
    _bind(key, fn) {
        this._rebind(key, fn);
        this._rebindIds ??= [];
        this._rebindIds.push(this._settings.connect(`changed::${key}`,
            () => this._rebind(key, fn)));
    }

    _rebind(key, fn) {
        this._bound ??= new Set();
        this._unbind(key);
        Main.wm.addKeybinding(key, this._settings, Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW, fn);
        this._bound.add(key);
    }

    _unbind(key) {
        if (this._bound?.has(key)) {
            Main.wm.removeKeybinding(key);
            this._bound.delete(key);
        }
    }

    /* --------------------------------------------------------------- D-Bus */

    Bless(_message) {
        this._charm?.bless();
    }

    Flick(strength) {
        this._charm?.flick(strength || 4);
    }

    SetCharm(charm) {
        if (CHARMS.some(c => c.id === charm))
            this._settings.set_string('charm', charm);
    }

    ListCharms() {
        return CHARMS.map(c => c.id);
    }

    Toggle() {
        this._settings.set_boolean('visible', !this._settings.get_boolean('visible'));
    }



    /* Diagnostic. Reports what the drag maths is actually doing, so a real
     * drag on a real machine can be measured rather than reasoned about. */
    get DragState() {
        const g = this._charm?._grab?.kind ?? '-';
        const d = this._charm;
        if (!d)
            return 'no dangle';
        const [cx, cy] = d._charmCentre();
        const [px, py] = global.get_pointer();
        return `dragging=${d._dragging} grab=${g} motions=${d._motionCount ?? 0} ` +
               `theta=${d._theta.toFixed(3)} ` +
               `stretch=${d._stretch.toFixed(0)} ` +
               `charm=(${Math.round(cx)},${Math.round(cy)}) ` +
               `pointer=(${px - d._mon.x},${py - d._mon.y}) ` +
               `lagBehindPointer=${Math.round(Math.hypot(px - d._mon.x - cx, py - d._mon.y - cy))}`;
    }

    OpenMenu() {
        this._charm?._openMenu();
    }

    get MenuOpen() {
        return this._charm?._menu?.isOpen ?? false;
    }

    get BlessCount() {
        return this._settings?.get_int('bless-count') ?? 0;
    }
}
