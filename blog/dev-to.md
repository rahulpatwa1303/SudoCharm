---
title: Every animation in my app had never once run
published: false
description: No errors. No warnings. Transitions starting and completing exactly on schedule — and nothing on screen moving. Three bugs from a Linux side project that never announced themselves, and the two tools that finally caught them.
tags: linux, gnome, javascript, debugging
canonical_url:
---

I have a good luck charm hanging from the top of my screen. It sways. You can
grab it and flick it, and when you tap it, it does a small thing belonging to
whichever charm is hanging: the scarab's wing cases open, the maneki-neko
beckons three times, the horseshoe flips over.

Except none of those had ever happened. Not once, on any machine, for the entire
life of the project.

There were no errors. Nothing in the log. The animations were *starting*. They
were *completing*, on schedule, to the millisecond. The value they were
animating simply never changed.

```js
// Runs. Completes. Does nothing.
wing.ease({rotation_angle_z: -34, duration: 420});

// Same actor, same frame, works exactly as asked.
wing.ease({opacity: 0, duration: 420});
```

GNOME's `ease()` builds a transition for `rotation-angle-z`, and the interval it
builds for that property comes out with no value type attached. There is nothing
to interpolate between, so it interpolates nothing, and then it reports success.
Opacity on the same actor in the same frame is fine. So you cannot even conclude
that easing is broken — four fifths of your animations work.

The fix is to stop asking and set the angle yourself:

```js
const timeline = Clutter.Timeline.new_for_actor(actor, duration);
timeline.connect('new-frame', () => {
    actor[prop] = from + (to - from) * ease(timeline.get_progress());
});
```

Five rituals came back to life at once — the wing cases, the spin, the beckon,
the flip, the daruma's nudge. I had written every one of them, watched every one
of them not work, and concluded every time that my angles were wrong.

That is the kind of bug this post is about. Not hard bugs — *quiet* ones. The
project is [SudoCharm](https://github.com/rahulpatwa1303/SudoCharm), a GNOME
Shell extension that does nothing useful on purpose, and it turned out to be an
excellent place to collect them.

## The drag that froze, and my three wrong answers

Grab the charm, pull, and it would follow the cursor for about twenty pixels and
then stop dead while the cursor carried on without it. It still believed it was
being dragged.

I diagnosed this wrong three times.

**First** I found a hard cap on how far the cord could stretch — 234 pixels from
the anchor. That is exactly what the symptom looks like. I replaced it with a
rubber band that follows your hand across the whole screen and only resists past
that. Good change. Fixed nothing.

**Second** I suspected a watchdog. A stray button-release would leave the charm
stuck to the pointer forever, so every frame it checks the button is still
physically down:

```js
const [, , mods] = global.get_pointer();
if (!(mods & Clutter.ModifierType.BUTTON1_MASK))
    this._endDrag();
```

Plausible. Also wrong — I printed the mask mid-drag and `BUTTON1` stayed true the
whole time.

**Third** I took a pointer grab, which was genuinely necessary and changed
nothing I could see.

The real answer is two mechanisms at once, and it is the thing I would most like
to have known at the start:

> On Wayland, once the pointer is over an ordinary window, its motion events go
> to **that application**, not to the shell. A handler on the stage stops hearing
> anything at all. Taking a Clutter grab fixes the routing — but a Clutter grab
> then delivers events to the **grab actor's subtree**, so `captured-event` on
> the stage stops firing for a second, unrelated reason.

Either one alone breaks the drag. Fixing either one alone changes nothing you can
observe. That is why I got it wrong three times in a row: every fix I made was
correct and every result looked identical.

The handlers belong on the grabbed actor:

```js
const grab = global.stage.grab(this._hitCharm);
this._hitCharm.connect('motion-event', ...);
this._hitCharm.connect('button-release-event', ...);
```

## The test that agreed with itself

Pull the charm right, and it swung left. Every interaction mirrored.

The cause is not exotic: a positive rotation moves a child **below** its pivot to
the left. Picture a clock hand at six o'clock — as it goes clockwise, it travels
left. I first wrote this off as a Clutter quirk. It is not; it is just what
rotation does when the pivot is overhead.

I know that for certain, because I later built a web version of the same
pendulum, tested the drag, and shipped it mirrored too. Here is the test I wrote:

```js
// theta === Math.atan2(dx, dy), to three decimal places, every time.
```

It passed. It passes now. It will always pass, because comparing the angle you
computed against the formula you computed it with proves your arithmetic and
nothing else. It cannot see which direction that angle *draws*.

The test that actually works asks a much dumber question:

```
pointer LEFT  of anchor (x=952)  -> charm centre 959  = left   OK
pointer RIGHT of anchor (x=1272) -> charm centre 1271 = right  OK
```

Which side of the anchor did the charm end up on. That is it. A test that
compares your output to your own reasoning will agree with you all the way off a
cliff.

## The eight exceptions a second that broke the whole shell

At one point Show Apps stopped working. Then clicking a window in the overview
stopped selecting it. Neither has anything to do with a charm on a string.

An orphaned instance of my extension — a hot-reload generation deleted from disk
while its clock was still running — was throwing `St.Widget already disposed`
about eight times a second, inside the compositor's frame dispatch. That is
enough to take the rest of GNOME down with it, and it presents as an unrelated
GNOME bug.

I twice told myself it had stopped, because I sampled a quiet minute of the log
and saw nothing. It had not stopped. Only a logout cleared it.

Four rules I would now apply to any extension that runs a clock:

- **Stop the clock first** in `destroy()`, before anything it touches is disposed.
- **Make teardown steps independent** so one failure cannot skip the rest.
- **Catch inside the tick and log once.** The difference between a broken feature
  and a broken session is a `try`/`catch` that stops the clock.
- **Version your instances.** Loading is async, so `enable`/`disable` can
  interleave with an in-flight import:

```js
disable() {
    this._generation = (this._generation ?? 0) + 1;  // invalidate in-flight boots
    this._impl?.disable();
}

async _boot(generation) {
    const {default: Impl} = await import(this._implUrl());
    if (generation !== this._generation) return;     // we were disabled meanwhile
    this._impl = new Impl(this);
}
```

## A bonus, since you are here: reloading without logging out

Editing a shell extension normally costs a logout, which is a miserable way to
iterate on a swing. GJS keeps every imported module for the life of the process,
keyed by resolved path, so disable/enable re-runs the **old** code.

A query string does not help. `import('./pendulum.js?v=2')` returns the cached
module. A path GJS has never seen does.

So `extension.js` is a small stable loader that, in dev mode, copies the
implementation into `.hot/<timestamp>/` on each enable and imports from there.
About a second, no logout. Two caveats: every file that participates has to come
along, because a module imported by a copy resolves its own imports inside that
copy's directory; and `metadata.json` and the compiled schema are still read once
at startup, so those do still need the logout.

It ships **off**, behind a marker file. Given what one orphaned generation did to
my session, I did not want that machinery running on anyone else's machine.

## What actually fixed all of this

Not thinking harder. Two small tools I should have written on day one.

```sh
./shoot /tmp/out        # run it in a nested GNOME Shell and photograph it
sudocharm-drag-check    # print the drag maths while you drag
```

`shoot` boots the extension in a nested shell under Xvfb and takes a picture. It
catches the entire class of bug that never raises an error and never appears in a
log, because none of these produce errors: a cord that stops short of the charm,
a charm pinned sideways at its swing limit, artwork hanging a few pixels off its
own pivot, five rituals doing nothing at all.

`drag-check` prints one line while you drag:

```
dragging=true grab=stage motions=142 theta=0.61 stretch=88
charm=(1204,318) pointer=(1210,322) lagBehindPointer=7
```

The counter is the whole point. `motions=` climbing while `theta` stays frozen
means the maths is wrong. `motions=` frozen means the events are not arriving at
all. From outside, those two states are identical — the charm sits there either
way — and every wrong answer I gave was a guess about which one I was looking at.

Both took under an hour. Written first, they would have saved nearly all of it.

Every bug here is the same bug wearing a different coat. The animation reported
success. The drag reported that it was dragging. The angle test reported that the
angle was right. The extension reported nothing at all while it took the shell
down. In each case the system was telling me something true and useless, and I
kept listening to it instead of going and looking.

**When you cannot see the failure, stop reasoning and go build the smallest thing
that shows it to you.** I have known that for years. A bead on a string made me
learn it again.

---

SudoCharm is GPL-3.0, GNOME 45–48, Wayland or X11, Linux only.
**[github.com/rahulpatwa1303/SudoCharm](https://github.com/rahulpatwa1303/SudoCharm)**

The idea comes from [Lucky Dangle](https://luckydangle.app/), a lovely Mac menu
bar app. The code and the artwork here are mine. If you are on a Mac, buy theirs.
