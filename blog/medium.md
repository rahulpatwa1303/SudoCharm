# My animations finished right on time. They just never happened.

### What a useless good luck charm taught me about the bugs that don't announce themselves

*A shorter, lighter version of [a post on dev.to](https://dev.to/) — that one has
the code.*

---

There is a good luck charm hanging from the top of my screen.

It sways. I can grab it and flick it, and the cord stretches while I pull and
whips when I let go. Tap it and it does a small thing belonging to whichever
charm is hanging — the scarab's wing cases open, the beckoning cat beckons three
times, the horseshoe flips over.

Except it didn't. None of those had ever happened, on any machine, for the entire
life of the project.

No errors. Nothing in the log. The animations were starting. They were
*completing*, on schedule, to the millisecond. The thing they were animating
simply never moved.

It turns out the animation helper I was using cannot animate a rotation on those
objects. It builds the transition, runs the clock, reports success, and
interpolates precisely nothing. Fade the same object in the same frame and it
works perfectly — so you cannot even conclude that animation is broken. Four
fifths of it works.

I had written five of these little rituals. I had watched all five of them not
work. And every single time I concluded my angles must be wrong, because the
system kept telling me the animation had run.

## The pattern

That is not a hard bug. It is a *quiet* one, and this small useless project
turned out to be full of them.

**The drag that froze.** Pull the charm and it followed my cursor for about
twenty pixels, then stopped dead while the cursor kept going — still convinced it
was being dragged. I diagnosed it wrong three times. I found a distance limit and
removed it: correct change, no effect. I blamed a safety check and disproved it. I
added a pointer grab, which was genuinely necessary and changed nothing visible.

The real answer needed two things to be true at once, and fixing either one alone
produced an identical result. That is *why* I got it wrong three times: every one
of my fixes was right, and every outcome looked the same.

**The test that agreed with itself.** Pull it right, it swung left. Everything
mirrored. I had a test for the drag angle, and it passed — it compared the angle
against the formula I had used to compute the angle. To three decimal places.
Every time. It will always pass, because it is checking my arithmetic against my
arithmetic. It cannot see which direction that angle actually *draws*.

The test that works asks a much stupider question: which side of the anchor did
the charm end up on? Left or right. That's it.

**The one that broke everything else.** For a while, clicking a window in the
overview stopped selecting it, and the Show Apps button did nothing. Neither has
anything to do with a charm on a string. An abandoned copy of my own code was
throwing an exception about eight times a second inside the compositor's frame
loop, which is enough to take the rest of the desktop down with it. It looked
exactly like an unrelated bug in GNOME.

I twice decided it had stopped, because I checked a quiet minute of the log and
saw nothing. It had not stopped.

## What actually fixed it

Not thinking harder. Two small tools, each under an hour to write, both written
far too late.

The first boots the whole thing in a nested desktop and takes a photograph. That
one tool catches the entire category of bug that never raises an error and never
appears in a log — a cord that stops short of the charm, a charm pinned sideways,
artwork hanging a few pixels off its own pivot, five animations doing nothing at
all. You cannot read those out of the source. You have to look.

The second prints one line while I drag, and the useful part is a counter: how
many motion events have actually arrived. If it climbs while the angle stays
frozen, my maths is wrong. If it stays frozen, the events aren't reaching me at
all. From the outside those two look identical — the charm just sits there — and
every wrong answer I gave was a guess about which one I was staring at.

## The thing worth keeping

Every bug here is the same bug in a different coat.

The animation reported success. The drag reported that it was dragging. The angle
test reported that the angle was correct. The abandoned code reported nothing
while it broke the desktop. In each case the system told me something true and
completely useless, and I kept listening to it instead of going and looking.

**When you cannot see the failure, stop reasoning and go build the smallest thing
that shows it to you.**

I have known that for years. I write it in code review. A bead on a string made
me learn it again.

---

The charm is called SudoCharm. It is free, it is GPL-3.0, it runs on Linux with
GNOME, and it does nothing useful whatsoever — that part is deliberate.
**[github.com/rahulpatwa1303/SudoCharm](https://github.com/rahulpatwa1303/SudoCharm)**

The idea comes from [Lucky Dangle](https://luckydangle.app/), a lovely little Mac
app that does the same thing on a menu bar. The code and artwork here are mine.
If you have a Mac, go and buy theirs.
