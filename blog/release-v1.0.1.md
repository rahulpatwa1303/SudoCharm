# v1.0.1 release notes

The zip is built and verified: `dist/sudocharm@rahulpatwa1303.github.io.shell-extension.zip`
(2.3M, metadata version 2). Paste the body below the line into the release.

```sh
git push origin master
git tag -a v1.0.1 -m "SudoCharm v1.0.1"
git push origin v1.0.1
```

Then `github.com/rahulpatwa1303/SudoCharm/releases/new` → tag `v1.0.1`, title
**SudoCharm v1.0.1**, attach the zip, paste the body.

The one-line installer points at `releases/latest`, so it picks this up the
moment the release is published — no change needed to `get.sh` or to anything
already written.

Verified from the zip, not from the working tree: installs into a throwaway
home, `State: ACTIVE`, version 2, D-Bus answers, no SudoCharm errors in the
shell log.

---

# SudoCharm v1.0.1

A power fix, prompted by a good question on the launch post: *does the pendulum
keep solving frames once the swing has settled, or does it park itself?*

It did not park itself. It does now.

## What was wrong

The animation clock was a frame callback that started when the extension loaded
and stopped only on teardown, so the compositor was asked to keep drawing
forever. And it could never have settled on its own: a damped swing approaches
zero without ever arriving, so every frame the angle changed by some invisible
amount that still counted as something to redraw.

Two consequences, both worse than the headline:

- **Turning the breeze off did not help.** It was never the breeze; it was the
  frame loop.
- **"Take it down" did not help either.** It hid the charm and left everything
  running, so it cost exactly as much as leaving it up.

## What changed

Once the charm is genuinely still, the last thousandths are snapped off and the
clock stops. A quarter-second timer keeps watching — ordinary code, which never
asks the screen to redraw — and starts the clock again on a press, a flick, a
bless, a settings change, a monitor change, or the charm becoming visible again
after the overview or a screen share.

Taking it down now genuinely stops it.

Measured before and after, sampling GNOME Shell's own CPU over 45 seconds in a
nested shell:

| | before | after |
| --- | --- | --- |
| Extension disabled (baseline) | 4.8% | — |
| Charm up, breeze off | 406% | **2.6%** |
| Charm taken down | 476% | **2.2%** |
| Charm up, breeze on | 421% | 259% |

Software rendering, so read the columns against each other rather than as watts.
Resting now costs less than the baseline did.

The breeze remains the honest exception: with it on, the charm really is
animating and that really does cost something. What changed is that turning it
off is now a genuine power switch rather than a cosmetic one.

## Also

- The release zip no longer picks up stray files left in `icons/`. A 2MB working
  file had found its way into v1.0.0 and nearly doubled it; the packer now takes
  only named assets and prints anything it skips.

## Install

```sh
curl -fsSL https://raw.githubusercontent.com/rahulpatwa1303/SudoCharm/master/get.sh | bash
```

Then log out and back in, or `Alt`+`F2` → `r` on X11.

GNOME Shell 45–48, Wayland or X11. Linux only. GPL-3.0-or-later.
