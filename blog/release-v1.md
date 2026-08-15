# v1.0.0 release notes

Paste the body below into the GitHub release. Everything above the line is
instructions for me, not for the release.

---

## Cutting it

The zip is built and verified: `dist/sudocharm@rahulpatwa1303.github.io.shell-extension.zip`

```sh
cd ~/code/personal/sudocharm
git push origin master                      # if anything is unpushed
git tag -a v1.0.0 -m "SudoCharm v1.0.0"
git push origin v1.0.0
```

Then either use the web UI —
`github.com/rahulpatwa1303/SudoCharm/releases/new`, pick tag `v1.0.0`, title
**SudoCharm v1.0.0**, paste the body, and attach the zip from `dist/` — or, with
`gh` installed:

```sh
gh release create v1.0.0 \
  dist/sudocharm@rahulpatwa1303.github.io.shell-extension.zip \
  --title "SudoCharm v1.0.0" \
  --notes-file blog/release-v1.md
```

(`--notes-file` will include these instructions; trim the file first or paste
the body by hand.)

**Turn on GitHub Pages at the same time** — Settings → Pages → `master` /
`docs`. The README and the release both point at the landing page.

## What was verified before cutting it

Not "it builds". The zip was installed into a throwaway `XDG_DATA_HOME` and run
in a nested GNOME Shell on a virtual display:

- `gnome-extensions install --force` from the zip: succeeds
- `gnome-extensions info`: **State: ACTIVE**, Enabled: Yes, Version 1
- D-Bus `Bless` over `gdbus`: returns `()`
- Photographed: the charm is drawn, hanging, and swinging
- Zero JS errors from SudoCharm in the shell log
- No `DEV` marker, no `.hot/`, no dev scripts, no `art.json` in the package —
  the hot-reload machinery ships off, which matters because an orphaned
  generation with a live clock can take the shell down

---

# SudoCharm v1.0.0

A good luck charm that hangs from the top edge of your screen and sways.

It is a real pendulum, not a looping animation — the cord stretches while you
pull it and whips when you let go, and the idle breeze is built from three
periods that never line up, so it never visibly repeats. Tap it and it performs
a small ritual belonging to whichever charm is hanging.

It does nothing useful. That is the entire point.

## Seven charms

| Charm | | Tap it and |
| --- | --- | --- |
| Nazar boncuğu | Turkey | it spins |
| Hamsa | Middle East & North Africa | the eye wakes |
| Nimbu-mirchi | India | the old lemon drops and a fresh one rises |
| Daruma | Japan | an eye gets painted |
| Maneki-neko | Japan | it beckons, three times |
| Horseshoe | Europe | it flips |
| Scarab | Egypt | the wing cases part |

Or any emoji you like, treated with the same reverence.

The daruma keeps score. Tap it once to make a wish and it paints its left eye;
tap it again when the wish lands and it paints the right. That survives reboots.

## In this release

- Seven charms, each drawn as separate pieces so the rituals are real — the
  lemon actually falls, the wing cases actually part
- Four things to hang it by: a fine thread, a round leather cord, twisted rope,
  or wooden beads
- **It takes itself down when you share your screen** and hangs itself back up
  afterwards. Charming on your own desktop, less so behind your head in a
  stand-up. Switch it off in preferences if you would rather it stayed
- Draws over every window without taking a single click — the charm itself is
  the only thing on screen that notices your mouse
- Drag the hook, or Ctrl-drag the charm, to re-hang it anywhere along the top
- On the session bus, so a git hook can ask it for luck:
  `sudocharm bless "$(git rev-parse --short HEAD)"`

## Install

```sh
gnome-extensions install --force sudocharm@rahulpatwa1303.github.io.shell-extension.zip
gnome-extensions enable sudocharm@rahulpatwa1303.github.io
```

**Then log out and back in.** GNOME cannot pick up a new extension any other
way. It catches everyone once.

GNOME Shell 45–48, Wayland or X11. Linux only, with no other platforms planned.
GPL-3.0-or-later.

## Credit

The idea comes from [Lucky Dangle](https://luckydangle.app/), a lovely little
Mac app that hangs a charm from your menu bar. This is an independent
implementation for GNOME — the code and the artwork are mine, the idea is
theirs. If you are on a Mac, go and buy theirs.
