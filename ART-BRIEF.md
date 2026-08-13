# Charm artwork — what to generate

Generate these elsewhere, drop the PNGs into `art-drop/`, and run:

```sh
./import-art          # normalises them onto the shared canvas
topknot-reload
```

A PNG overrides the SVG of the same name, so nothing else has to change.
Delete the PNG to fall back to the vector art.

## The one rule that matters

**Charms with a ritual must be generated as separate pieces.** The lemon falls
off the chili string. The cat's paw beckons. The scarab's wing cases part. A
single flat image of the whole charm cannot do any of that — the pieces have to
be separate files so they can move independently.

Everything else the importer fixes for you: it keys out a flat background,
trims, scales, and places each piece where that charm's ritual expects it.

## Technical constraints

| | |
| --- | --- |
| Size | 1024×1024, square |
| Background | Transparent. If your tool cannot: **flat magenta `#FF00FF`** — the importer keys it out |
| Framing | Object centred, fully visible, ~5% margin, nothing cropped |
| Orientation | Upright, front-on, as it hangs — the cord attaches at top centre |
| No | Drop shadows, text, watermarks, background scenery, multiple objects |
| Check | It is displayed at about **76px**. If it is mush at that size, it is too detailed |

Do not reproduce Lucky Dangle's artwork — this is our own set.

## Style anchor

Put the same suffix on every prompt so the seven read as one set:

> …clean illustrated icon, front view, soft directional shading with a subtle
> rim light, rich saturated colour, smooth gradients, crisp silhouette,
> readable at small size, centred, transparent background, no drop shadow, no
> text, square 1024×1024

## The shot list

Filenames must match exactly — that is how the layers are matched to the rituals.

### Single-piece charms

| File | What |
| --- | --- |
| `nazar.png` | Turkish evil-eye bead: concentric dark blue, white, light blue, black pupil. Glass, with a highlight |
| `hamsa.png` | Downward-pointing open hand, symmetrical, an eye set in the palm. Metal or enamel |
| `horseshoe.png` | Iron horseshoe, ends downward, nail holes. Worn, pitted metal — not clean chrome |

### Nimbu-mirchi — 2 pieces

| File | What |
| --- | --- |
| `nimbu-string.png` | Seven dried red chilies threaded on a cord, hanging in a bunch, cord running up out of frame. **No lemon** |
| `nimbu-lemon.png` | One whole fresh lemon, on its own, small stem at the top |

The current version's weakest art — the chilies read as a red flower. Ask for
seven *distinct, separated, slightly curved* chilies, dried and glossy.

### Daruma — 1 piece, eyes stay vector

| File | What |
| --- | --- |
| `daruma-body.png` | Round red daruma doll, gold trim, thick eyebrows and moustache, **both eyes blank white circles** |

Leave the eyes empty. The pupils are painted on as an overlay so they can
appear one at a time — that is the whole ritual. If you would rather generate
them, add `daruma-eye-l.png` and `daruma-eye-r.png`, each a single black
painted pupil alone on transparency.

### Maneki-neko — 2 pieces

| File | What |
| --- | --- |
| `neko-body.png` | Seated white beckoning cat, red collar with a gold bell, left paw resting on a gold koban. **No raised right paw — leave that shoulder bare** |
| `neko-paw.png` | One raised cat forearm and paw, on its own, angled as if beckoning |

### Scarab — 3 pieces

| File | What |
| --- | --- |
| `scarab-body.png` | Scarab beetle from above: head, six legs, **abdomen fully visible and uncovered** |
| `scarab-wing-l.png` | Left wing case (elytron) alone — a long teal-green half-shell |
| `scarab-wing-r.png` | Right wing case, mirrored |

The wing cases lie closed over the body and part to reveal it, so the body must
be drawn complete underneath, and the two elytra together should cover it.

## Check the filenames match the content

Generators hand back files in whatever order they finished, and it is very easy
for the names to end up on the wrong images. In the first batch three pairs were
swapped: the lemon arrived as `daruma-body.png`, the horseshoe as `hamsa.png`,
and the whole beetle as `scarab-wing-l.png`. Nothing warns you — the import
silently succeeds and the charm is simply wrong.

Open the folder and look before importing. `import-art` reports the dominant
colour of each layer, which catches the obvious cases.

## After importing

`./import-art` prints where each piece landed on the canvas. If it warns that
the top of the art sits below 0.13, the cord will not reach it — either
regenerate with less empty space above the object, or raise `CORD_OVERLAP` in
`pendulum.js`.

Check the result with `./shoot /tmp/art` and look at the frames.
