---
title: Granting root privileges to good luck on Linux
published: false
description: A GNOME Shell extension that hangs a good luck charm from the top of your Linux screen. It sways, you can flick it, and it does nothing useful. Free, GPL-3.0.
tags: linux, gnome, opensource, showdev
cover_image: https://raw.githubusercontent.com/rahulpatwa1303/SudoCharm/master/docs/hanging.png
canonical_url:
---

Computers are full of notifications, status bars, terminals and spreadsheets.
Almost everything on your screen is trying to be productive.

**SudoCharm** is not.

It is a small GNOME extension that hangs a good luck charm from the top edge of
your screen on a cord. It drifts in a simulated breeze. You can grab it with your
mouse, pull it down, and flick it. Click it, and it performs a small ritual.

It does nothing useful. That is the entire point.

![A nazar bead hanging on a string of wooden beads below the GNOME top bar, over a desktop](https://raw.githubusercontent.com/rahulpatwa1303/SudoCharm/master/docs/hanging.png)

> **In short:** SudoCharm is a free, open-source GNOME Shell extension for Linux
> (GNOME 45–48, Wayland or X11). It hangs one of seven traditional good luck
> charms below your top bar, drawn over your windows but taking none of your
> clicks. Install it with one command; it is GPL-3.0 and there is nothing to buy.

---

## Why build it?

The idea comes from [Lucky Dangle](https://luckydangle.app/), a wonderful menu
bar app for macOS. I saw it, loved the thought of having a charm dangling over my
workspace, and wanted one on Linux.

If you are on a Mac, go and buy theirs. For GNOME, I built an independent
open-source version from scratch — my code, my artwork, their idea.

The name comes from `sudo`, which grants superuser rights on Unix. SudoCharm
applies that to luck, which is obviously not something you can be granted
privileges over. That is the joke, and it does not need explaining twice.

---

## What it actually does

The charm hangs below the GNOME top bar, floating over your open windows. Four
things make it feel like an object rather than a widget:

- **It behaves like a real cord.** Pull it down and the string stretches; let go
  and it whips back. This is an actual pendulum solved every frame, not a looping
  animation — so a longer cord genuinely swings slower, and a flick makes the
  charm trail behind the cord and catch up.
- **The breeze never repeats.** The idle sway is built from three slow waves of
  6.7, 10.9 and 17.3 seconds. Those never line up, so the drift never loops. A
  looping sway is the single thing that makes an object like this feel cheap.
- **It never gets in the way.** Only the charm and its hook accept mouse clicks.
  Everything around them is completely click-through, so you can work normally
  underneath it.
- **It hides during screen shares.** Start a video call, a screen recording or a
  remote desktop session and the charm quietly takes itself down, then hangs
  itself back up when the capture ends. Delightful on your own desktop; less so
  behind your head in a stand-up.

---

## The charms

SudoCharm ships with seven traditional charms, each with its own artwork and its
own ritual. Click one and it performs it:

1. **Nazar boncuğu** *(Turkey)* — the classic evil eye. Click it and it spins.
2. **Nimbu-mirchi** *(India)* — seven chilies and a lemon, hung at a threshold to
   turn away misfortune. Click it and the old lemon drops away while a fresh one
   rises into place.
3. **Daruma** *(Japan)* — the goal-setting doll. Click it once to paint its left
   eye when you make a wish; click it again when the wish lands to paint the
   right. It saves that state, so the doll keeps score across reboots.
4. **Maneki-neko** *(Japan)* — the beckoning cat. Click it and its paw beckons
   three times.
5. **Hamsa** *(Middle East & North Africa)* — the protective hand. Click it and
   the eye wakes.
6. **Horseshoe** *(Europe)* — click it for a flip and a bounce.
7. **Scarab** *(Egypt)* — click it and the wing cases swing open.

There is also an **emoji** option, so you can hang any character you like — 🍀,
🧿, or whatever you consider lucky — from the same cord.

You can also choose what it hangs by: a fine thread, a round leather cord,
twisted rope, or wooden beads.

---

## How to install it

**One command.** It fetches the latest release, installs it and enables it:

```bash
curl -fsSL https://raw.githubusercontent.com/rahulpatwa1303/SudoCharm/master/get.sh | bash
```

Then **log out and back in**. GNOME cannot load a new extension into a running
Wayland session — there is no way around it, and it catches everyone once. On
X11 you can press `Alt`+`F2`, type `r`, and hit Enter instead.

Would rather not pipe a script into your shell? Reasonable. Download the zip from
[Releases](https://github.com/rahulpatwa1303/SudoCharm/releases) and run the same
two steps by hand — there is nothing to unzip, `gnome-extensions` takes the zip
as it comes:

```bash
gnome-extensions install --force sudocharm@rahulpatwa1303.github.io.shell-extension.zip
gnome-extensions enable sudocharm@rahulpatwa1303.github.io
```

Or from source:

```bash
git clone https://github.com/rahulpatwa1303/SudoCharm.git
cd SudoCharm
./install.sh
```

**Requirements:** Linux, GNOME Shell 45–48, Wayland or X11. GPL-3.0-or-later,
free, and staying that way. There is no macOS or Windows version and none
planned.

---

## How to use it

| | |
| --- | --- |
| **Click the charm** | It drops down and performs its ritual |
| **Drag it** | It swings, and the cord stretches as you pull |
| **Drag the hook**, or Ctrl-drag the charm | Re-hang it anywhere along the top edge |
| **Right-click it** | Switch charms, read where each one comes from, turn the breeze off, take it down, or open settings |
| `Super`+`Alt`+`L` | Call it down |
| `Super`+`Alt`+`K` | Take it down, or hang it back up |

Take it down and a bare hook stays under the top bar. Click the hook whenever you
want it back.

Size, cord length, what it hangs by, how strong the breeze is and how quickly a
flick rings down are all in preferences:

```bash
gnome-extensions prefs sudocharm@rahulpatwa1303.github.io
```

---

## Blessing your commits

Everything runs on the session bus (D-Bus), so any shell script can reach the
charm with no dependencies.

Bless a commit automatically:

```bash
# .git/hooks/post-commit
sudocharm bless "$(git rev-parse --short HEAD)"
```

Or have it bless a passing test suite and give it a nudge when the tests fail:

```bash
pytest && sudocharm bless || sudocharm flick 9
```

Every developer I have shown this to finds it funnier than it deserves.

---

## Questions people asked

**Does it work on Wayland?**
Yes, on both Wayland and X11. Wayland is actually the reason it is a shell
extension rather than an ordinary app: a normal Wayland client cannot draw above
other applications' windows *and* let clicks pass through to them. Only the
compositor can grant that, and on GNOME the compositor is the shell.

**Will it show up when I share my screen?**
No. It detects screencasts, recordings and remote sessions and takes itself down
until the capture ends. If you would rather it stayed, there is a switch for that
in preferences.

**Does it get in the way of clicking things?**
No. The artwork is drawn on a layer that is deliberately absent from the
compositor's input region. Only two small rectangles — the charm and its hook —
accept input. Everything else passes straight through to whatever is underneath.

**Why do I have to log out?**
GNOME Shell loads extensions once, at startup, and cannot pick up a new one in a
running Wayland session. It is a GNOME limitation, not a SudoCharm one. On X11,
`Alt`+`F2` then `r` restarts the shell without logging out.

**Is it heavy on the battery?**
Not when it is still. Once the charm settles it stops the animation clock
completely, so an idle desktop goes back to drawing nothing at all — a quarter-
second timer watches for a reason to start again, which costs nothing because it
never asks the screen to redraw. Measured in a nested shell: with the charm at
rest the shell used less CPU than it did with the extension disabled. The one
exception is the breeze, which is a genuine animation and genuinely costs
something; turn it off with a right-click and the charm parks. There is no
network access and no telemetry.

**Is it really free?**
Yes. GPL-3.0-or-later, no paid tier, nothing to buy.

---

## Get it

- **Source and releases:** [github.com/rahulpatwa1303/SudoCharm](https://github.com/rahulpatwa1303/SudoCharm)
- **Licence:** GPL-3.0-or-later
- **Requires:** Linux, GNOME Shell 45–48

The idea is [Lucky Dangle](https://luckydangle.app/)'s, and is used here with
admiration. If you have a Mac, go and buy theirs.
