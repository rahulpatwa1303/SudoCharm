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

I measured it properly before claiming anything: two builds differing only in
this change, installed from their release zips into a throwaway home, each run
twice, sampling GNOME Shell's own CPU over 45 seconds.

| | before | after |
| --- | --- | --- |
| Charm up, breeze off | 296%, 343% | **2.3%, 2.5%** |
| For reference: extension not installed at all | | 2.0% |

An idle charm now costs about what having no charm at all costs.

Two caveats, because the numbers deserve them. That is a nested shell falling
back to software rendering, so the absolute figures are far larger than a real
GPU would produce — read them against each other, not as watts. And the
mechanism, rather than the magnitude, is the part that does not depend on the
renderer: a running frame-clock asks the compositor for frames whether or not
anything moved, and software rendering changes what each frame costs, not
whether it happens.

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
