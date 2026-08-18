# Reply to the "does it park itself?" comment

Short and plain. The long technical version is in the commit message for
"Stop the clock when there is nothing to draw" if anyone wants it.

---

You were right, and thank you — this was worth fixing.

**It didn't park.** The animation clock started when the extension loaded and
never stopped. It couldn't have stopped on its own either: a damped swing keeps
getting smaller without ever reaching zero, so there was always a sliver of
movement left to draw.

**It parks now.** Once the charm is still, it snaps off the last fraction and
stops the clock. A quarter-second timer watches for a reason to start again — a
click, a drag, a settings change — and that timer never asks the screen to
redraw anything.

Two things your question turned up that I had wrong:

- **Turning the breeze off wasn't saving anything.** Now it does.
- **"Take it down" left everything running**, so it cost the same as leaving the
  charm up. That was just a bug. It genuinely stops now.

On numbers: with the charm idle, GNOME Shell now uses about what it uses with
the extension not installed at all. I measured that in a nested test shell
rather than on real hardware, so take it as a comparison rather than a battery
figure — but the problem underneath it was real, and it's gone.

Ships in v1.0.1.
