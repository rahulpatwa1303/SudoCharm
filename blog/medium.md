# I hung a good luck charm from the top of my screen

### It does nothing useful. That turned out to be the hard part.

*Originally published on [dev.to](https://dev.to/) — this version is lighter on
code.*

---

There is a Mac app called [Lucky Dangle](https://luckydangle.app/) that hangs a
small charm from your menu bar. It has no features. You cannot configure it into
usefulness. It just hangs there, and sways, and you can flick it.

I saw it, wanted it, and I run Linux.

So now there is [SudoCharm](https://github.com/rahulpatwa1303/SudoCharm), which
hangs a nazar bead from the top edge of my screen on a cord. Or a daruma doll, or
a nimbu-mirchi, or four others — seven charms, each from a different tradition,
each with its own small ritual. Click the daruma and it paints one eye; click it
again when the wish lands and it paints the other. That state survives reboots,
which means the doll on my screen is quietly keeping score of things I said I
would do.

None of this is useful. I want to be clear about that up front, because the
uselessness is not an apology. It is the specification.

## Why a toy is harder than it looks

The pendulum maths took an afternoon. Three coupled systems, integrated every
frame: the swing, the cord's elasticity, and the charm's own lag behind the cord.

```
θ''       = −(g/L)·sin θ − damping·θ' + breeze(t)
stretch'' = −k·stretch − c·stretch' + ω²·L·0.06
lag''     = −k₂·(lag − θ) − c₂·lag'
```

Two decisions in there matter more than the equations do.

**Gravity is a lie.** Real gravity, at screen scale, swings far too slowly to
read as a small object on a short string — it looks like a wrecking ball filmed
from a helicopter. The number in the code is 2600 px/s², chosen by eye until it
looked like a keyring.

**The breeze must not loop.** It is three sine waves with periods of 6.7, 10.9
and 17.3 seconds. Those do not divide into one another, so the idle drift never
visibly repeats. A looping sway is the single thing that makes an object like
this feel cheap — your eye finds the loop in about fifteen seconds and then it is
a GIF, not a thing.

The third piece is the one that sells it. The charm hangs *from* the cord rather
than being welded to it, so it lags behind and then catches up. That is why a
flick makes it whip. Take that spring out and you have a rod with a picture on
the end.

All of that was the easy afternoon. Everything after it was the desktop.

## The part where I was confidently wrong

For it to work at all, the charm has to draw over every window and take none of
your clicks. On Wayland, an ordinary application cannot do both — painting above
other people's windows *and* passing input through them is the compositor's
privilege to grant. So this is a GNOME Shell extension rather than an app, and it
gets to ask the compositor for exactly the arrangement it needs: a monitor-sized
layer that is drawn but absent from the input region, plus two small rectangles —
the charm and its hook — that are the only pixels on the screen that take a
click.

That worked immediately. Then dragging broke, and it cost me more time than
everything else in the project put together.

The symptom: grab the charm, pull, and it follows your cursor for about twenty
pixels before stopping dead while the cursor carries on without it. It still
thinks it is being dragged.

I diagnosed it wrong three times. I found a distance cap and removed it — a good
change that fixed nothing. I suspected a watchdog and disproved it. I added a
pointer grab, which was genuinely necessary and changed nothing visible.

The real answer needed both halves at once. On Wayland, once the pointer moves
over an ordinary window, its motion events go to that application and not to the
shell — so a handler listening on the stage simply stops hearing anything. A
Clutter grab fixes the routing. But a Clutter grab then delivers events to the
grabbed actor's subtree, so the stage-level handler stops firing for a *second*
reason. Two mechanisms, either one enough to break it, and fixing one alone
leaves the symptom exactly as it was.

There is a version of this article where I present that as an insight. It was
not. It was a long stretch of being certain.

## What actually fixed it

Not thinking harder. A counter.

I wrote a tiny script that prints one line while you drag:

```
dragging=true grab=stage motions=142 theta=0.61 stretch=88
charm=(1204,318) pointer=(1210,322) lagBehindPointer=7
```

That `motions=` field is the whole thing. If it climbs while the angle stays
frozen, my maths is wrong. If it stays frozen, the events are not arriving at
all. From the outside those two states are identical — the charm sits there
either way — and every wrong answer I gave was a guess about which one I was
looking at.

I wrote a second tool for the same reason: it boots the extension in a nested
GNOME Shell under Xvfb and photographs it. That one catches the whole class of
bug that never raises an error and never appears in a log — a cord that stops
short of the charm, a charm pinned sideways against its swing limit, artwork
hanging a few pixels off its own pivot. You cannot read those out of the source.
You have to look.

Both tools took under an hour to write. I wrote them near the end. Written at
the start, they would have saved nearly all of it.

That is the only real lesson I got out of a good luck charm: **when you cannot
see the failure, stop reasoning and go build the smallest thing that shows it to
you.** I know this. I have known it for years. I still argued with a bead
for days.

## It also has a D-Bus interface, because of course it does

The one concession to usefulness is that it sits on the session bus, so anything
that can run a command can reach it:

```sh
# .git/hooks/post-commit
sudocharm bless "$(git rev-parse --short HEAD)"

pytest && sudocharm bless || sudocharm flick 9
```

Every developer I have shown this to finds it funnier than it deserves.

---

SudoCharm is GPL-3.0, GNOME Shell 45–48, Wayland or X11, Linux only, with no
other platforms planned. Source and releases:
**[github.com/rahulpatwa1303/SudoCharm](https://github.com/rahulpatwa1303/SudoCharm)**

The idea is Lucky Dangle's, and is used here with admiration. The code and the
artwork are mine. If you are on a Mac, buy theirs.
