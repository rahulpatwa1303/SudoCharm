---
title: Notes from building a GNOME Shell extension that does nothing useful
published: false
description: A good luck charm hangs from the top of my screen and swings. Getting it to swing correctly taught me more about Wayland input than anything useful ever has.
tags: linux, gnome, javascript, showdev
canonical_url:
---

There is a Mac app called [Lucky Dangle](https://luckydangle.app/) that hangs a
small charm from your menu bar. I saw it, wanted it, and I run Linux, so that was
that.

What I ended up with is [SudoCharm](https://github.com/rahulpatwa1303/SudoCharm):
a GNOME Shell extension that hangs a nazar bead — or a daruma, or a
nimbu-mirchi, or four others — from the top edge of the screen on a cord. It
sways. You can grab it and flick it. Click it and it performs a small ritual
belonging to that particular charm: the daruma paints an eye, the scarab's wing
cases part, the lemon drops off the nimbu-mirchi and a fresh one rises.

It does nothing useful. That is the entire point.

What follows is the part that surprised me. Not the physics — the physics was an
afternoon. The surprise was how much of GNOME Shell only misbehaves once
the thing is actually hanging on a real desktop, and how bad I turned out to be
at diagnosing behaviour I could not see.

## Why it has to be a shell extension

The first question worth asking is whether this needs privileged access to the
compositor at all. It does, and the reason is specific.

The charm must draw over every window, and it must not eat clicks. On X11 you
could get away with an override-redirect window and an input shape. On Wayland a
normal client cannot do both — it cannot paint above other applications' windows
*and* pass pointer events through to them. That combination is the compositor's
to grant, and in GNOME the compositor is the shell.

Inside the shell it is two lines:

```js
// A monitor-sized layer, drawn above everything, absent from the input region.
Main.layoutManager.addTopChrome(this._layer, {
    affectsInputRegion: false,
    trackFullscreen: true,
});

// A small rectangle that does take input.
Main.layoutManager.trackChrome(area, {affectsInputRegion: true});
```

The artwork lives on the big layer, so it never intercepts anything. Two small
tracked rectangles — the charm and its hook — are the only pixels on screen that
take clicks. Everything else behind the layer carries on exactly as before.

There is deliberately no scroll handler anywhere. The grabbable area is invisible
and sits over other people's windows; swallowing scroll there would stop the page
underneath from scrolling and nobody would ever work out why.

One consequence I did not anticipate: moving a tracked actor makes the compositor
recompute its input region. The charm never stops moving. Following it every frame
means recomputing the input region sixty times a second, forever, for a toy. The
hit area now only catches up when the charm has drifted more than 8px from where
the rectangle currently sits.

## The drag that froze, and three wrong answers

The bug: grab the charm, pull, and it would follow the pointer for maybe twenty
pixels and then stop dead while the cursor carried on without it. It still
believed it was being dragged. Release, and it swung from wherever it had given
up.

I diagnosed this wrong three times.

**First**, I found a hard cap on how far the cord could stretch — 234 pixels from
the anchor. That looked exactly like the symptom. I replaced it with a rubber
band that tracks the hand one-to-one across most of the screen and only resists
past that, which was the right change to make and did not fix the bug.

**Second**, I suspected a watchdog. Because a button-release can go astray, the
tick checks every frame that the button is still physically down:

```js
if (this._dragging && this._time - this._pressTime > 0.15) {
    const [, , mods] = global.get_pointer();
    if (!(mods & Clutter.ModifierType.BUTTON1_MASK))
        this._endDrag();
}
```

Plausible. Also wrong — I printed the mask during a drag and `BUTTON1` stayed
true the whole time.

**Third**, I took a pointer grab, which is genuinely necessary and still changed
nothing:

```js
this._grab = global.stage.grab(this._hitCharm);
```

The actual answer is both halves of that at once, and it is the thing I would
most want to have known at the start:

> On Wayland, once the pointer is over an ordinary window, its motion events go
> to that application, not to the shell. A handler listening on the stage stops
> hearing anything at all. Taking a Clutter grab fixes the routing — but a
> Clutter grab delivers events to the **grab actor's subtree**, which means
> `captured-event` on the stage stops firing too.

So the grab was correct and my handlers were now in the wrong place. They belong
on the grabbed actor:

```js
const grab = global.stage.grab(this._hitCharm);
this._hitCharm.connect('motion-event', ...);
this._hitCharm.connect('button-release-event', ...);
this._hitCharm.connect('touch-event', ...);
```

Two mechanisms, each individually enough to break the drag, and fixing either one
alone leaves the symptom completely unchanged. That is why I got it wrong three
times in a row.

## The exception storm that broke the shell

At one point Show Apps stopped working. Then clicking a window in the overview
stopped selecting it. Nothing in my extension had anything to do with either.

The cause was an orphan. My hot-reload scheme (below) copies the implementation
into a fresh directory on each enable, and one earlier generation had been
deleted from disk while its instance was still alive — its `Clutter.Timeline` was
still ticking, and every tick threw `St.Widget already disposed`. Roughly eight
exceptions a second, raised inside the compositor's frame dispatch.

That is enough to take the rest of the shell down with it. The overview's own
frame handling never completes, so the click never lands, and it looks like an
unrelated GNOME bug.

I also told myself twice that it had stopped, because I sampled a quiet
sixty-second window of the log and saw nothing. It had not stopped. Only a logout
cleared it.

Four changes, and I would apply all four to any extension that runs a clock:

- **Stop the clock first** in `destroy()`, before anything it touches is
  disposed.
- **Make teardown steps independent**, so one failure does not skip the rest.
- **Catch in the tick and log once.** A `try`/`catch` that stops the clock and
  logs a single line is the difference between a broken feature and a broken
  session.
- **Version the instances.** Loading is asynchronous, so `enable`/`disable` can
  interleave with an in-flight import. A generation counter bumped in both, and
  checked after the `await`, means a stale import can never install itself.

```js
enable() {
    this._generation = (this._generation ?? 0) + 1;
    this._boot(this._generation).catch(e => console.error(e));
}

disable() {
    this._generation = (this._generation ?? 0) + 1;   // invalidate in-flight boots
    this._impl?.disable();
    this._impl = null;
}

async _boot(generation) {
    const {default: SudoCharm} = await import(this._implUrl());
    if (generation !== this._generation) return;      // we were disabled meanwhile
    this._impl = new SudoCharm(this);
    this._impl.enable();
}
```

## Reloading without logging out

Editing a shell extension normally costs a logout, which is a miserable way to
iterate on a swing. GJS keeps every imported module for the life of the process,
keyed by resolved path, so a plain disable/enable re-runs the *old* code.

A query string does not get around it. `import('./pendulum.js?v=2')` returns the
cached module. A path GJS has never seen does.

So `extension.js` is a small stable loader that, in dev mode, copies the
implementation into `.hot/<timestamp>/` on each enable and imports from there.
Reload is about a second:

```sh
touch DEV           # dev mode on
sudocharm-reload    # ~1s, no logout
```

Two caveats. Every file that participates has to come along — a module imported
by a copy resolves its own relative imports inside that copy's directory, so
`charms.js` travels with `pendulum.js` or the copy imports nothing. And
`metadata.json` and the compiled GSettings schema are still read once at startup,
so changing those does still need a logout.

The `DEV` marker file matters more than it looks. It ships off. Given what an
orphaned generation did to my session, I did not want that machinery running on
anyone else's machine.

## Two small physics traps

**Anything hanging below its pivot rotates the wrong way.** A positive
`rotation_angle_z` moves a child *below* the pivot to the **left**. This is not a
Clutter quirk, which is what I first assumed — it is just what rotation does when
the pivot is overhead. Think of a clock hand at six o'clock: as it goes
clockwise, it travels left. Get it backwards and every interaction is mirrored —
you pull right, it swings left. The renderer negates:

```js
this._pendulum.rotation_angle_z = -this._theta * 180 / Math.PI;
```

I am confident about the "not a Clutter quirk" part because I later wrote a web
version of the same pendulum, checked the drag angle against `Math.atan2`, saw it
agree to three decimal places, and shipped it mirrored. CSS `rotate()` does
exactly the same thing. Comparing the angle to the angle you computed only proves
your arithmetic; it says nothing about which direction that angle draws. The
test has to ask where the charm *ended up on screen*.

**A swing limit must not be recomputed from the current angle.** The charm has a
ceiling on how far it may swing, which starts wherever you let go and tightens as
it settles. My first version recalculated it from the live angle every frame,
which makes the ceiling equal to the angle — so on the very first frame after
release the "hit the limit" test is true, the bounce fires, and `omega *= -0.3`
throws away seventy percent of the momentum. Pull the charm right out, let go,
and it sagged. The fix is one line: set the ceiling to full headroom on release
and only ever let it tighten.

## The thing I actually learned

Look back at that list. The distance cap, the watchdog, the missing grab, the
orphan I twice declared dead: every one of them is me reasoning confidently about
an interaction I could not observe. I was debugging by argument.

What ended it was two small tools, and I should have written them on day one.

```sh
./shoot /tmp/out        # run it in a nested shell and photograph it
sudocharm-drag-check    # print the drag maths while you drag
```

`shoot` starts a nested GNOME Shell under Xvfb and takes a picture. It catches
what an error log never will, because none of these produce errors: a cord that
fails to reach the charm, a charm pinned sideways at its swing limit, artwork
sitting a few pixels off its own pivot.

`drag-check` prints one line while you drag:

```
dragging=true grab=stage motions=142 theta=0.61 stretch=88
charm=(1204,318) pointer=(1210,322) lagBehindPointer=7
```

The counter is the whole point. `motions=` climbing while `theta` stays frozen
means the maths is wrong. `motions=` frozen means the events are not arriving at
all. Those two states are indistinguishable from the outside — the charm sits
there either way — and it was that counter that
finally identified the Wayland routing problem, after I had spent far too long on
the wrong three answers.

If you take one thing from this: when you cannot see the failure, stop reasoning
and go build the smallest thing that shows it to you. I lost far more time to being sure than to
being wrong.

---

SudoCharm is GPL-3.0, GNOME Shell 45–48, Wayland or X11, Linux only. Source and
releases: **[github.com/rahulpatwa1303/SudoCharm](https://github.com/rahulpatwa1303/SudoCharm)**

The idea is Lucky Dangle's. The code and the artwork are mine. If you are on a
Mac, buy theirs.
