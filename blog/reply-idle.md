# Reply to the "does it park itself?" comment

> Does the pendulum keep solving frames once the swing has settled, or does it
> park itself until something touches it? Anything ticking per frame inside the
> shell process is the bit I'd want to know about before leaving it on a laptop
> all day.

**Publish v1.0.1 before posting this** — the last line points them at it, and
right now the newest release is v1.0.0, which still has the old behaviour.

---

You were right to ask, and it was doing the thing you were worried about.
Acknowledged, and now fixed — thank you, genuinely.

**Before:** it kept solving frames. The clock started when the extension loaded
and never stopped. It couldn't have stopped by itself either — a damped swing
keeps getting smaller without ever reaching zero, so there was always a sliver
of movement left to draw.

**Now:** it parks itself until something touches it, which is exactly how you
put it. Once the charm is still it snaps off the last fraction and stops the
clock. A quarter-second timer watches for a reason to start again — a click, a
drag, a settings change — and that timer never asks the screen to redraw.

Two things your question turned up that I had wrong:

- **Turning the breeze off wasn't saving anything.** Now it does. With the
  breeze on the charm genuinely is animating, so that one still costs something
   — but it's a switch, and now it's a real one.
- **"Take it down" left everything running**, so it cost the same as leaving the
  charm up. That was just a bug. It stops properly now.

On leaving it running all day: with the charm idle, GNOME Shell now uses about
what it uses with the extension not installed at all. I measured that in a
nested test shell rather than on real hardware, so treat it as a comparison
rather than a battery figure — but the problem underneath was real, and it's
gone.

If you're trying it, take **v1.0.1** — v1.0.0 is the one with the old
behaviour.
