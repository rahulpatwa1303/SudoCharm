# Reply to the "does it park itself?" comment

Paste from the line below. It is deliberately not defensive — they are right,
and the honest answer is more interesting than a reassuring one.

---

Straight answer: **it does not park itself.** You were right to ask.

The clock is a `Clutter.Timeline` with `repeat_count(-1)`, started when the
extension loads and stopped only on teardown or if a frame throws. So it solves
a frame whenever the shell draws one, settled or not.

It is worse than "it idles cheaply", for a reason I had not thought about until
your comment. The swing is damped, so the angle decays *asymptotically* — it
approaches zero and never arrives. The transform therefore changes by some tiny
amount every single frame, forever, which means the compositor always has
something to redraw. It never gets to go quiet.

I measured it rather than guess, in a nested GNOME Shell on a virtual display,
sampling the shell process's own CPU time over 45 seconds:

| | shell CPU |
| --- | --- |
| Extension disabled | 4.80%, and 4.82% on a repeat run |
| Charm hanging, breeze on | 420% |
| Charm hanging, breeze off | 406% |
| Charm taken down (`Super`+`Alt`+`K`) | 476% |

**Read those numbers carefully.** That is software rendering (llvmpipe), which
multi-threads rasterisation across cores and wildly overstates the absolute cost
— a real GPU will be a small fraction of it. What survives the caveat is the
shape: enabling it takes the shell from near-idle to continuously compositing,
and the three "on" numbers are the same number within noise.

Two things fall out of that, both of which are on me:

1. **Turning the breeze off does not help.** People will reasonably assume it
   does. It is not the breeze that costs anything, it is the frame loop.
2. **Taking the charm down does not help either, and that is a bug.** The tick
   early-returns when it is hidden, but the timeline keeps firing and the layer
   is still mapped, so the compositor keeps working. "Take it down" currently
   hides it without switching it off. If you want it genuinely off today, disable
   the extension rather than taking the charm down.

The arithmetic itself is nothing — a few dozen floating-point operations per
frame, which is noise next to compositing. The cost is entirely that a repeating
timeline holds the frame clock open.

What I am going to do about it:

- Snap to rest and **stop the clock** once the angle, velocity and cord stretch
  are all under a threshold, rather than chasing an asymptote forever.
- Restart it on the things that should wake it: a press or hover on the charm, a
  `bless`, a settings change, a monitor change.
- Replace the per-frame polling of overview/menu/modal state with the signals
  those already emit, so nothing needs a frame just to notice a change.
- Make "take it down" actually stop the clock instead of only hiding the charm.

That makes the resting state cost nothing at all, which is what it should have
been. Thank you for asking the question in a way that made me go and measure it
— I would have told you it was fine.
