/* SudoCharm — a good luck charm, knotted to the top of your screen.
 * Copyright (C) 2026 Rahul Patwa
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option)
 * any later version. See the LICENSE file for the full text.
 */

/* cord.js — the cord the charm hangs from.
 *
 * Drawn with Cairo rather than being a styled St.Widget rotated into place.
 * A rectangle only has clean edges while it is upright: at every other angle
 * the compositor gives it no antialiasing, so a 4px cord with 1px light and
 * dark side borders breaks up into a stair-stepped, dashed twig — which is
 * exactly when you look at it, because that is when the charm is swinging.
 *
 * Drawing it ourselves also buys the bow. A cord has its own weight, so its
 * middle trails the fast part of a swing while its two ends are pinned. That
 * curve is most of what separates a cord from a rod, and it is the reason this
 * file exists rather than a nicer stylesheet.
 *
 * Everything here is in the pendulum's own frame, where the cord always hangs
 * straight down the middle. The swing is the pendulum actor's rotation; this
 * only ever draws a nearly-vertical line, and `bow` is a plain x offset.
 */

import St from 'gi://St';
import Cairo from 'gi://cairo';

import {CORD_STYLES} from './cord-styles.js';

/* Repainting is not free, so it only happens when the drawing would actually
 * differ. Below this, a change in the bow is not worth a new texture. */
const BOW_EPSILON = 0.35;
const SLIDE_EPSILON = 0.25;

export class Cord {
    constructor(style = 'rounded', path = null) {
        // Where icons/beads/ lives, so a bead can be loaded by name. NOT
        // _path: that is the method below that draws the cord's centre line,
        // and a field of the same name silently replaces it — the cord then
        // stops being drawn at all, beads and rope together.
        this._dir = path;
        this._surfaces = new Map();
        this.actor = new St.DrawingArea({reactive: false});
        this._repaintId = this.actor.connect('repaint', () => this._repaint());

        this._style = CORD_STYLES.includes(style) ? style : 'rounded';
        this._length = 0;
        this._bow = 0;
        this._tail = 0;
        this._slide = 0;
        this._slot = 64;
        this._rope = [0.42, 0.31, 0.17];
        this._beadNames = [];
    }

    /** What this charm hangs by: rope colour, and the beads strung on it. */
    setPalette(cord) {
        if (!cord)
            return;
        const hex = cord.rope ?? '#6b4f2a';
        this._rope = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
        this._beadNames = cord.beads ?? [];
        this.actor.queue_repaint();
    }

    /* Beads are photographs, loaded once and kept. Cairo will happily scale one
     * down to the four or five pixels it is actually drawn at, and that reads as
     * polished stone in a way a flat disc never quite does. A missing file is
     * not worth failing over — the drawn fallback below covers it. */
    _beadSurface(name) {
        if (this._surfaces.has(name))
            return this._surfaces.get(name);
        let surf = null;
        try {
            if (this._dir)
                surf = Cairo.ImageSurface.createFromPNG(
                    `${this._dir}/icons/beads/${name}.png`);
        } catch (e) {
            console.error(`SudoCharm: bead '${name}' — ${e}`);
        }
        this._surfaces.set(name, surf);
        return surf;
    }

    /**
     * Place and size the cord.
     *
     * @param {number} slot   width of the pendulum; the cord hangs down its middle
     * @param {number} length distance from the hook to the charm's hang point
     */
    layout(slot, length, tail = 0) {
        this._length = Math.max(1, length);
        this._tail = Math.max(0, tail);
        this._slot = slot;
        this.actor.set_position(0, 0);
        // Tall enough for the round cap at the bottom, which the charm covers
        // anyway; wide enough that a full bow cannot be clipped; and long
        // enough for a tail, where one charm carries the cord on past its own
        // hanging point to something tied below it.
        this.actor.set_size(Math.max(8, slot),
            Math.round(this._length + this._tail) + 4);
        this.actor.queue_repaint();
    }

    setStyle(style) {
        if (!CORD_STYLES.includes(style) || style === this._style)
            return;
        this._style = style;
        this.actor.queue_repaint();
    }

    /** How far the cord's middle is pushed sideways, in pixels. Sign follows
     *  the pendulum's own frame: positive is towards increasing swing angle. */
    setBow(bow) {
        if (Math.abs(bow - this._bow) < BOW_EPSILON)
            return;
        this._bow = bow;
        this.actor.queue_repaint();
    }

    /** How far the beads have slid up the cord, in pixels. Positive moves the
     *  group away from the charm, towards the hook. */
    setSlide(slide) {
        if (Math.abs(slide - this._slide) < SLIDE_EPSILON)
            return;
        this._slide = slide;
        this.actor.queue_repaint();
    }

    destroy() {
        if (this._repaintId)
            this.actor.disconnect(this._repaintId);
        this._repaintId = 0;
        this.actor.destroy();
        this.actor = null;
    }

    /* ----------------------------------------------------------- the drawing */

    _repaint() {
        const cr = this.actor.get_context();
        const [w] = this.actor.get_surface_size();
        const x = w / 2;
        const len = this._length;
        const bow = this._bow;

        cr.setLineCap(Cairo.LineCap.ROUND);
        cr.setLineJoin(Cairo.LineJoin.ROUND);

        if (this._style === 'thread')
            this._thread(cr, x, len, bow);
        else if (this._style === 'twist')
            this._twist(cr, x, len, bow);
        else if (this._style === 'beads')
            this._beads(cr, x, len, bow);
        else
            this._rounded(cr, x, len, bow);

        if (this._tail > 0)
            this._drawTail(cr, x, len, bow);

        cr.$dispose();
    }

    /* Some charms are not the end of the cord. The nimbu-mirchi hangs by the
     * brass ring on its chilies and the lemon is tied on below them, so the
     * cord has to carry on past the hanging point and out the other side.
     *
     * Drawn behind the charm, like the rest of the cord, so it runs down among
     * the chilies and only shows in the gap beneath them. It leaves the curve
     * along the same tangent the bow ends on, then straightens, so a hard swing
     * does not put a kink where the two meet. */
    _drawTail(cr, x, len, bow) {
        const tail = this._tail;
        const cxp = x - bow * 0.28;
        const draw = (width, r, g, b, a) => {
            cr.moveTo(x, len);
            cr.curveTo(cxp, len + tail * 0.45, x, len + tail * 0.75,
                       x, len + tail);
            cr.setLineWidth(width);
            cr.setSourceRGBA(r, g, b, a);
            cr.stroke();
        };
        draw(3.0, 0, 0, 0, 0.28);
        draw(1.7, ...this._rope, 1);
    }

    /** The cord's centre line. Both ends stay pinned however far it bows, so
     *  the charm can never come off the end of it. */
    _path(cr, x, len, bow) {
        cr.moveTo(x, 0);
        cr.curveTo(x + bow, len * 0.35, x + bow * 0.85, len * 0.72, x, len);
    }

    _stroke(cr, x, len, bow, width, r, g, b, a) {
        this._path(cr, x, len, bow);
        cr.setLineWidth(width);
        cr.setSourceRGBA(r, g, b, a);
        cr.stroke();
    }

    /** Where the centre line sits at a given fraction of the way down — the
     *  cubic above, evaluated so the twist marks can follow the bow. */
    _offsetAt(t, bow) {
        const u = 1 - t;
        return bow * (3 * u * u * t + 0.85 * 3 * u * t * t);
    }

    /** A point on the centre line. The y control points sit at 0.35 and 0.72 of
     *  the length, so y is not simply t·len and has to be evaluated too. */
    _pointAt(t, x, len, bow) {
        const u = 1 - t;
        const y = 3 * u * u * t * (0.35 * len) +
                  3 * u * t * t * (0.72 * len) +
                  t * t * t * len;
        return [x + this._offsetAt(t, bow), y];
    }

    /* A table of the curve sampled by arc length, so a bead can be placed a
     * given number of pixels back from the charm. Walking the arc rather than
     * stepping the curve's parameter matters: the cubic is not uniformly
     * parameterised, so equal steps in t bunch up at one end. */
    _arcTable(x, len, bow) {
        const STEPS = 96;
        const pts = [];
        let prev = this._pointAt(0, x, len, bow);
        let run = 0;
        pts.push({d: 0, p: prev});
        for (let i = 1; i <= STEPS; i++) {
            const p = this._pointAt(i / STEPS, x, len, bow);
            run += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
            pts.push({d: run, p});
            prev = p;
        }
        return {pts, total: run};
    }

    /** The point `back` pixels up the cord from the charm end of it. */
    _backFromEnd(table, back) {
        const want = Math.max(0, Math.min(table.total, table.total - back));
        let i = table.pts.length - 1;
        while (i > 0 && table.pts[i].d > want)
            i--;
        return table.pts[i].p;
    }

    /* Where the beads sit, bottom-up, measured back from the charm.
     *
     * Fixed in number and anchored to the charm end — NOT spaced out to fill
     * the cord. Filling it means the count changes with the cord's length, so
     * pulling the charm down spawns new beads out of nowhere and shifts every
     * colour along the strand as the pattern re-indexes. They are threaded on
     * a cord; there are as many as there are, and they ride down by the charm.
     *
     * `slide` is how far the group has been thrown along the cord by the
     * charm's own acceleration — see the slide spring in pendulum.js. */
    _beadCentres(x, len, bow, r, slide) {
        const table = this._arcTable(x, len, bow);
        const gap = r * 2.02;                     // just touching, as strung
        const out = [];
        for (let i = 0; i < this._beadNames.length; i++) {
            // The lowest bead rests against the charm's loop; the ones above
            // stack on it. Beads further up the group get a little more of the
            // slide, because the ones below them are held up by the charm.
            const back = r * 0.55 + i * gap + slide * (0.55 + 0.22 * i);
            out.push(this._backFromEnd(table, Math.max(0, back)));
        }
        return out;
    }

    /* Beads threaded on a cord. Drawn as flat discs with an inset highlight
     * rather than with a real gradient: at this size a bead is a few pixels
     * across, and three stacked circles read as round there while costing
     * nothing.
     *
     * They stay ON the curve sideways, so they inherit its bow — both its ends
     * are pinned, the top to the hook and the bottom to the charm's own hole,
     * and the middle is what swings. What the beads have of their own is
     * movement ALONG the cord: they are threaded on it and slide. */
    _beads(cr, x, len, bow) {
        const rope = this._rope;
        const names = this._beadNames;

        // A charm with no beads named simply hangs on its cord.
        if (!names.length) {
            this._rounded(cr, x, len, bow);
            return;
        }

        // Beads grow with the charm rather than staying a fixed size, so a big
        // charm does not end up on a strand of grit.
        const r = Math.max(2.5, Math.min(10, this._slot * 0.075));

        this._stroke(cr, x, len, bow, r * 0.78, 0, 0, 0, 0.30);
        this._stroke(cr, x, len, bow, r * 0.42, rope[0], rope[1], rope[2], 1);

        const centres = this._beadCentres(x, len, bow, r, this._slide);
        for (let i = 0; i < centres.length; i++) {
            const [bx, by] = centres[i];
            const surf = this._beadSurface(names[i]);

            if (surf) {
                const w = surf.getWidth(), h = surf.getHeight();
                cr.save();
                cr.translate(bx - r, by - r);
                cr.scale(2 * r / w, 2 * r / h);
                cr.setSourceSurface(surf, 0, 0);
                cr.paint();
                cr.restore();
                continue;
            }

            // No artwork for it: a lit disc in the rope's own colour.
            const lit = rope.map(v => Math.min(1, v + 0.20));
            const hot = rope.map(v => Math.min(1, v + 0.45));
            cr.arc(bx, by, r + 0.5, 0, 2 * Math.PI);
            cr.setSourceRGBA(0, 0, 0, 0.30);
            cr.fill();
            cr.arc(bx, by, r, 0, 2 * Math.PI);
            cr.setSourceRGBA(rope[0], rope[1], rope[2], 1);
            cr.fill();
            cr.arc(bx - r * 0.22, by - r * 0.26, r * 0.72, 0, 2 * Math.PI);
            cr.setSourceRGBA(lit[0], lit[1], lit[2], 1);
            cr.fill();
            cr.arc(bx - r * 0.34, by - r * 0.38, r * 0.28, 0, 2 * Math.PI);
            cr.setSourceRGBA(hot[0], hot[1], hot[2], 0.85);
            cr.fill();
        }
    }

    /* A fine waxed thread. The dark halo is what lets 2px survive: the charm
     * hangs over whatever wallpaper the user happens to have, and a bare thread
     * this thin disappears into a bright sky. */
    _thread(cr, x, len, bow) {
        this._stroke(cr, x, len, bow, 3.4, 0, 0, 0, 0.28);
        this._stroke(cr, x, len, bow, 1.8, ...this._rope, 1);
        this._stroke(cr, x, len * 0.92, bow, 0.6, 1, 1, 1, 0.20);
    }

    /* Round leather cord: the weight the extension has always had, but with a
     * soft shadow under it and a single lit edge, so it reads as round. */
    _rounded(cr, x, len, bow) {
        this._stroke(cr, x, len, bow, 4.6, 0, 0, 0, 0.26);
        this._stroke(cr, x, len, bow, 3.2, ...this._rope, 1);
        this._stroke(cr, x - 0.85, len * 0.96, bow, 1.0, 1, 0.93, 0.78, 0.28);
    }

    /* Twisted rope: the same body, raked with the barber-pole of a twist. The
     * marks are clipped to the cord so they cannot spill past its edges. */
    _twist(cr, x, len, bow) {
        this._stroke(cr, x, len, bow, 5.0, 0, 0, 0, 0.28);
        this._stroke(cr, x, len, bow, 3.6, ...this._rope, 1);

        cr.save();
        this._path(cr, x, len, bow);
        cr.setLineWidth(3.6);
        cr.clipPreserve();
        cr.newPath();

        cr.setLineWidth(1.2);
        cr.setSourceRGBA(1, 0.92, 0.74, 0.30);
        for (let y = 1; y < len - 1; y += 4.5) {
            const dx = x + this._offsetAt(y / len, bow);
            cr.moveTo(dx - 2.6, y + 1.4);
            cr.lineTo(dx + 2.6, y - 1.4);
        }
        cr.stroke();
        cr.restore();
    }
}
