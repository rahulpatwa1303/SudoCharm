# Topknot

**A good luck charm, knotted to the top of your screen.**

It hangs on a cord over your desktop and sways in a breeze. It stays out of
every click. Grab it and give it a flick and it swings like the pendulum it
actually is — the cord stretches when you pull, and whips when you let go.
Call it down and it performs a ritual particular to that charm.

Seven charms from seven traditions, plus any emoji you like.
GNOME Shell 45–48, Wayland or X11.

| Charm | Origin | Ritual |
| --- | --- | --- |
| Nazar boncuğu | Turkey | Flick it — it spins |
| Hamsa | Middle East & North Africa | The eye wakes |
| Nimbu-mirchi | India | The old lemon drops, a fresh one rises |
| Daruma | Japan | Paint one eye for the wish, the other when it lands |
| Maneki-neko | Japan | Three beckons |
| Horseshoe | Europe | A flip and a bounce |
| Scarab | Egypt | The elytra part |

## Install

```sh
git clone <this repo> topknot
cd topknot
./install.sh
```

Then **log out and back in once**. GNOME Shell cannot load an extension into a
running Wayland session, so the charm only appears after a fresh session.

`install.sh` symlinks the repo into `~/.local/share/gnome-shell/extensions/`,
so the checkout stays the source of truth.

## Using it

| Action | What happens |
| --- | --- |
| Click the charm | It drops and performs its ritual |
| **Drag the charm** | It swings, and the cord *stretches* as you pull. Let go mid-swipe and it flies |
| **Drag the hook** (or Ctrl-drag the charm) | Re-hang it anywhere along the top edge |
| Take it down | The bare hook stays under the top bar — **click the hook** to hang it back up |
| Right-click it | Menu: switch charms, read the story, toggle the breeze |
| `topknot menu` | Open that same menu from a shell |
| `Super`+`Alt`+`L` | Call it down |
| `Super`+`Alt`+`K` | Hang it up, or take it down |
| `topknot bless` | Call it down, from a shell, a script, or a git hook |

The daruma keeps its progress across sessions. Call it down once to make a wish
(left eye), again when the wish lands (right eye), and a third time for a fresh
doll. "Start over" in the preferences resets it.

## Blessing things from scripts

```sh
topknot bless                # call it down
topknot flick 6              # just push it
topknot toggle               # hang it up or take it down
topknot charm daruma         # switch charms
topknot count                # times called down
```

Plain D-Bus underneath, so nothing needs installing on the other end:

```sh
gdbus call --session --dest org.gnome.Shell \
  --object-path /org/gnome/shell/extensions/topknot \
  --method org.gnome.Shell.Extensions.Topknot.Bless "build"
```

Bless a commit in `.git/hooks/post-commit`:

```sh
#!/bin/sh
topknot bless "$(git rev-parse --short HEAD)"
```

Bless a green test run, nudge it on a red one:

```sh
pytest && topknot bless || topknot flick 9
```

## How it works

**It is a pendulum, not an animation.** Every frame integrates three coupled
systems: the swing, the cord's elasticity, and the charm's own lag.

```
θ''       = -(g/L)·sin θ − damping·θ' + breeze(t)      the swing
stretch'' = −k·stretch − c·stretch' + ω²·L·0.06        the cord
lag''     = −k₂·(lag − θ) − c₂·lag'                    the charm on the cord
```

The cord being elastic is most of what separates a string from a rod: pulling
lengthens it, letting go snaps it back with one small recoil, and a fast swing
visibly draws it out. The charm hangs *from* the cord rather than being welded
to it, so a flick makes it whip.

A note on signs, because getting this wrong mirrors every interaction: θ is
positive when the charm is to the **right**, but Clutter's `rotation_angle_z`
turns the other way — a child hanging below the pivot moves **left** for a
positive angle. This was measured, not assumed. Rendering negates θ; everything
else thinks in the direction a hand actually moves.

`L` is the live cord length — stretch and drop both feed into it — so pulling
the charm down genuinely slows its period. `g` is tuned by eye rather than taken
from physics: real gravity at screen scale swings far too slowly to read as a
small object on a short string. The breeze is three sines whose periods (6.7s,
10.9s, 17.3s) do not divide into each other, so the drift never visibly loops.

Dragging drives θ *and* the cord length from the pointer, sampling both
velocities, so releasing mid-swipe throws the charm at the speed your hand was
actually moving and lets the cord snap back.

**Only the charm takes clicks.** The artwork is a monitor-sized chrome layer
added with `affectsInputRegion: false` — drawn above every window, absent from
the compositor's input region. Two small `trackChrome` hit areas (the charm and
the hook) are the only rectangles on the screen that take input. This is the
whole reason it is a shell extension rather than an ordinary app: on Wayland a
normal client cannot draw over other windows *and* be click-through.

The grabbable area follows the charm, but only once the charm has actually moved
more than 8px from where that area currently sits. Moving a tracked actor
recomputes the compositor's input region, and the charm never stops moving — so
chasing it every frame would mean recomputing forever. The threshold makes a
gentle sway cost a couple of updates per cycle and a hard flick a brief burst.

**Dragging needs a grab, and the grab changes where events arrive.** The
charm's grabbable box is small, so a drag leaves it within a few pixels. On
Wayland, once the pointer is over an ordinary window its motion events go to
that application, not to the shell — so a drag handler listening on the stage
simply stops hearing anything. `dragging` stays true while the angle and
stretch freeze at whatever they were when the pointer crossed the edge, which
looks exactly like a distance limit and is not one.

Taking a `global.stage.grab()` fixes the routing, but it also *moves* it: a
Clutter grab delivers events to the grab actor's subtree, so the stage's
`captured-event` stops firing entirely. The handlers therefore live on the
grabbed actor, with the stage handler kept only as a fallback for when no grab
can be taken.

Both of those were found by measuring a real drag, not by reading the code —
see "Measuring a drag" below.

**It stays out of the shell's way.** Because the charm is top chrome, its
grabbable box would otherwise sit *above* panel menus, the overview and any
modal — so a click meant for the system menu or a dock item would land on the
charm instead. Whenever the shell is showing something of its own
(`Main.overview.visible`, an open panel menu, or `Main.modalCount > 0`) the
charm stops taking input, and in the overview it hides entirely. The grabbable
box is also clamped so it can never ride up into the top bar when the charm
swings near horizontal.

There is deliberately **no scroll handler**. The grabbable area is invisible and
sits over other windows, so swallowing scroll events there would stop the page
underneath from scrolling — a nudge is not worth that.

**The art** is SVG layers that all share one 128×128 canvas. Because every layer
is drawn in its final position on the same grid, an animated part (a lemon, an
eye, a paw, an elytron) only ever has to move *relative to where it was drawn* —
no per-charm layout maths, and the pieces stay registered at any size.

## Working on it, without logging out

GNOME Shell cannot restart in place on Wayland — the compositor *is* the display
server. Worse, disabling an extension does not unload its code: GJS keeps every
imported module for the life of the process, keyed by resolved path. So
disable/enable runs `disable()` and `enable()` on the **old** module and never
re-reads your file, and editing an extension normally costs you a logout.

A query string does not get around it — `import('./pendulum.js?v=2')` returns the
cached module, because GJS resolves the path and drops the query. A path GJS has
never seen does. So `extension.js` is a stable shim that, in dev mode, copies
the implementation into a fresh directory on every enable and imports that:

```sh
topknot-reload      # disable + enable = a real reload, ~1 second
```

Dev mode is on whenever a file named `DEV` sits in the extension directory.
Delete it for a shipped copy and `extension.js` imports `pendulum.js` directly,
copying nothing and writing nothing to `.hot/`.

Two things still need a logout, because the shell reads them once at startup:
`metadata.json` and the compiled GSettings schema.

### Why teardown is written so carefully

Hot reloading makes a whole class of bug easy to create and very hard to
notice. If `destroy()` leaves the frame clock running, the old instance keeps
ticking over its own destroyed actors — sixty times a second, for the rest of
the session, from code that has already been deleted from disk. A storm of
exceptions inside the compositor's frame dispatch takes the rest of the shell
with it: the overview stops animating and the Show Applications button does
nothing.

Three things prevent it, and all three are needed:

- `destroy()` stops the clock **first**, before anything it touches is
  disposed, and every later step is independent — one throwing step used to
  abort the rest of teardown.
- `_tick()` catches, stops the clock, and reports **once**. A per-frame failure
  must never become a per-frame exception.
- `enable()` claims a generation and a boot only installs itself if it still
  owns it. Loading is async, so disable-then-enable can otherwise let a stale
  import build a second instance that nothing holds a reference to.

An orphan created this way cannot be cleaned up by reloading, because nothing
holds a reference to it. Only restarting the shell clears it.

## Measuring a drag

Drag behaviour cannot be tested from here — there is no way to synthesise a
pointer that lands on the charm. So the extension exposes a read-only
`DragState` over D-Bus, and:

```sh
topknot-drag-check      # then grab the charm and pull it
```

prints, several times a second:

```
dragging=true grab=stage motions=229 theta=-1.095 stretch=470 charm=(1374,286) pointer=(1372,287) lagBehindPointer=2
```

`motions` is the important one: it counts the motion events the drag handler
actually processed. Frozen angles with `motions=0` means events are not
arriving. Frozen angles with `motions` climbing means the maths is wrong. Those
are completely different bugs and they look identical from the outside — two
separate wrong fixes went in before this counter existed.

`lagBehindPointer` should sit at 0 until the cord's rubber band starts to
resist.

## Seeing it

Checking that an extension throws no exceptions says nothing about whether it
looks right. `./shoot` runs the extension in a nested shell on a virtual
display and photographs it, which is the only way to catch the things that
matter — a cord that fails to reach the charm, a charm pinned sideways at its
swing limit, a grabbable box sitting over the wrong part of the screen.

```sh
./shoot /tmp/out              # four frames, at rest
./shoot /tmp/out Flick 3.0    # four frames after a push
```

It needs `Xvfb` and ImageMagick's `import`. GNOME 46 restricts its own
screenshot API to the shell's UI, and a nested shell renders to a Wayland
surface that host-side tools cannot capture, so the virtual X display is the
way in.

## Files

```
extension.js   the loader — a stable shim, see "Working on it" above
pendulum.js      the pendulum, the chrome layers, drag and flick, D-Bus, shortcuts
charms.js      charm definitions, actor construction, and the rituals
prefs.js       preferences window
icons/         SVG layers, all on a shared 128x128 canvas
schemas/       GSettings schema
topknot     D-Bus CLI
```

## Replacing the artwork

The charms ship as hand-authored SVG. To replace them with generated or
commissioned art, see `ART-BRIEF.md` — it has the shot list, the constraints,
and the reason charms with rituals must be generated as separate pieces.

```sh
./import-art        # normalises art-drop/*.png onto the shared canvas
topknot-reload
```

A PNG in `icons/` overrides the SVG of the same name, so swapping art needs no
code change, and deleting the PNG falls back to the vector.

## Adding a charm

1. Draw the layers as `128×128` SVGs in `icons/`, each part in its final
   position on that canvas.
2. Add an entry to `CHARMS` in `charms.js` — `parts` are stacked back to front,
   and `pivot` sets a part's rotation centre as a fraction of the canvas.
3. Add a `case` to `playRitual()`.

Nothing else needs to change; the menu, preferences and D-Bus all read from
`CHARMS`.

## The name

A topknot is a knot tied at the top — which is exactly what this is, and where
it lives. GNOME calls the panel across the top of your screen the *top bar*.

## Credit

The idea is lifted, with admiration, from [Lucky
Dangle](https://luckydangle.app/) — a macOS menu bar app. This is an independent
GNOME implementation: the code and the artwork are original, only the concept is
borrowed. If you are on a Mac, buy theirs.
