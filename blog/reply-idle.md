# Reply to the "does it park itself?" comment

Paste from the line below.

---

Thank you for raising this — you found a real optimisation problem, and a bug
underneath it that I would not have gone looking for. Acknowledged, and now
fixed.

**Short version: it didn't park. It does now.**

**Before.** The animation clock started when the extension loaded and never
stopped. Worse, it *couldn't* stop on its own: a damped swing gets smaller and
smaller but never reaches exactly zero, so there was always a hair of movement
left to draw. Your screen only redraws when something changes, and something was
always changing.

**After.** Once the charm is genuinely still, it snaps the last
thousandth off and stops the clock completely. A cheap quarter-second timer keeps
watching — that's ordinary code, it doesn't ask the screen to redraw anything —
and starts the clock again the moment you touch the charm, click it, change a
setting, or close the overview.

I measured before and after, sampling GNOME Shell's own CPU over 45 seconds:

| | before | after |
| --- | --- | --- |
| Extension disabled (baseline) | 4.8% | — |
| Charm up, breeze **off** | 406% | **2.6%** |
| Charm taken down | 476% | **2.2%** |
| Charm up, breeze **on** | 421% | 259% |

Those are software-rendering numbers from a nested shell, so the absolute values
are far higher than real hardware — read the columns against each other, not as
watts. Resting now costs less than the baseline did.

Two things worth calling out:

**The breeze is the honest exception.** With it on, the charm really is animating
— that's the feature, and no amount of cleverness makes a moving object free. But
turning it off is now a genuine power switch instead of a cosmetic one, which it
wasn't before. Right-click → Breeze.

**"Take it down" was a real bug and you found it.** It hid the charm but left
everything running, so it cost the same as leaving it up. The tick returned early
when hidden — before it ever reached the code that decides whether to stop. I had
almost recommended it as the battery-saving option in this very reply. It now
genuinely stops.

None of this would have been found without the question, so genuinely — thank
you. The fix is on `master` and goes out as v1.0.1; the one-line installer picks
up the new release automatically, so there is nothing you need to do differently
when you try it.
