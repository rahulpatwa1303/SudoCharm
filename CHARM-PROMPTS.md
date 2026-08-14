# Charm prompts

Copy-paste prompts for regenerating the art in `art-drop/`. The rules about
filenames, separate pieces and importing live in [ART-BRIEF.md](ART-BRIEF.md) —
this is just the wording.

Two things changed from the last batch: every hanging piece ends in a loop at
the top, and the nimbu-mirchi is specified properly.

## No beads in the artwork

The beads belong to the cord, not to the charm — `cord.js` draws them, the same
way it draws the twist. Painted into the charm PNG they would be rigid with it,
and the charm lags behind the cord by up to `MAX_LAG` — about 31 degrees — so
at the fast part of a swing the bead column would point a third of a right
angle off the cord threaded through it. They would also eat height out of the
box `import-art` fits each piece into, shrinking the charm itself at 76px.

So: **no beads, no knots, no cord in any prompt.** What the art needs instead
is somewhere for the cord to end.

## The hanging loop

Every piece that hangs from the cord — `nazar`, `hamsa`, `horseshoe`,
`nimbu-string`, `daruma-body`, `neko-body`, `scarab-body` — gets a small loop
at top centre, moulded in the charm's own material, with the hole clearly open.
The lowest bead sits in that loop, and the charm's lag reads as the loop
turning on the bead, which is what a real one does.

Never on `neko-paw`, `scarab-wing-l/r`, `nimbu-lemon` or the daruma eyes —
those move independently during the ritual and would carry a loop around with
them.

Keep it small — no more than 10% of the height, because the shell paints its
cord into the top 13% (`CORD_OVERLAP` in `pendulum.js`) and that is all the
room there is.

## Style suffix

Every prompt ends with the same two clauses so the seven read as one set.

**Loop clause** (hanging pieces only):

> at the top centre a small hanging loop moulded into the charm itself, a
> closed ring in the same material with its hole clearly open, no more than
> 10% of the total height, its top touching the top edge of the frame

**Style clause** (everything):

> clean illustrated icon, front view, soft directional shading with a subtle
> rim light, rich saturated colour, smooth gradients, crisp silhouette,
> readable at 76px, centred, transparent background, no drop shadow, no
> text, no background scenery, one object only, no cord and no beads, square
> 1024×1024

If the tool cannot do transparency, swap the background for **flat magenta
`#FF00FF`** — `import-art` keys it out.

---

## Single-piece charms

### `nazar.png`

> A Turkish nazar boncuğu evil-eye bead, seen face on: a flat round disc of
> glass in concentric rings — deep cobalt blue at the rim, then white, then
> pale sky blue, then a solid black pupil at the centre. Thick glass with a
> soft specular highlight in the upper left and a slightly uneven,
> hand-poured edge. At the top centre a small hanging loop moulded into the
> charm itself, a closed ring in the same material with its hole clearly
> open, no more than 10% of the total height, its top touching the top edge
> of the frame. Clean illustrated icon, front view, soft directional shading
> with a subtle rim light, rich saturated colour, smooth gradients, crisp
> silhouette, readable at 76px, centred, transparent background, no drop
> shadow, no text, no background scenery, one object only, square 1024×1024.

### `hamsa.png`

> A hamsa hand amulet hanging point down: a symmetrical open palm with the
> thumb and little finger mirrored outward, three straight fingers below,
> and a single almond-shaped eye set in the centre of the palm. Aged brass
> with turquoise enamel inlay and fine engraved border detail — solid and
> heavy, not filigree. At the top centre a small hanging loop moulded into
> the charm itself, a closed ring in the same material with its hole clearly
> open, no more than 10% of the total height, its top touching the top edge
> of the frame. Clean illustrated icon, front view, soft directional shading
> with a subtle rim light, rich saturated colour, smooth gradients, crisp
> silhouette, readable at 76px, centred, transparent background, no drop
> shadow, no text, no background scenery, one object only, square 1024×1024.

### `horseshoe.png`

> An old iron horseshoe hanging with both ends pointing down, U-shaped, with
> eight square nail holes and a creased toe clip. Dark pitted wrought iron,
> scratched and unevenly worn, warm rust in the pits — a shoe that has been
> on a horse, not polished chrome. At the top centre a small hanging loop
> moulded into the charm itself, a closed ring in the same material with its
> hole clearly open, no more than 10% of the total height, its top touching
> the top edge of the frame. Clean illustrated icon, front view, soft
> directional shading with a subtle rim light, rich saturated colour, smooth
> gradients, crisp silhouette, readable at 76px, centred, transparent
> background, no drop shadow, no text, no background scenery, one object
> only, square 1024×1024.

---

## Nimbu-mirchi — 2 pieces

This is the one that has never been right. The last batch came back as a red
flower because the chilies were splayed evenly around a centre point like
petals. What it actually is: a sewing needle dragged a length of coarse thread
through one lemon and seven chilies, and the whole lot hangs off a doorway
drying out.

What has to be true:

| | |
| --- | --- |
| Chilies | Seven. Threaded through the **stalk end**, hanging tips **down**, near vertical |
| Their shape | Long, tapering, each curving a different way — not a fan, not a ring |
| Their state | Part dried: deep brick red going to dark maroon, wrinkled and shrunken along the length, matte with a faint waxy sheen, dry brown-green calyx at the top of each |
| Their arrangement | Bunched at the top and loose at the bottom, overlapping front to back, uneven lengths |
| The lemon | An Indian *kagzi nimbu* — small, round, thin-skinned, mottled green-yellow. **Not** a large bright-yellow Eureka lemon with nipple ends |
| The thread | Coarse natural cotton, visible where it passes between items, knotted at the top |

The layer geometry puts the chilies at the top and the lemon at the bottom
(`PLACEMENT` in `import-art`), which is the version where the thread ends in
the lemon. The lemon-on-top arrangement is just as common in practice — if you
ever want that instead, it is a swap of the two `PLACEMENT` rows, not a
regeneration.

### `nimbu-string.png`

> Seven dried red chilies threaded onto a single coarse cotton thread and
> hanging in a bunch, tips pointing down. Each chili is long and tapering
> with its own slight, different curve, wrinkled and shrunken from drying,
> deep brick red darkening to maroon at the tip, matte with a faint waxy
> sheen, with a dry brown-green stalk and calyx at the top where the thread
> passes through. They gather tightly at the thread and hang loose and
> uneven below, at different lengths, overlapping in front of and behind
> each other — a hanging bunch, not a fan, not a rosette, not radiating from
> a centre. Absolutely no lemon and no fruit of any kind. At the top centre
> a small hanging loop moulded into the charm itself, a closed ring in the
> same material with its hole clearly open, no more than 10% of the total
> height, its top touching the top edge of the frame. Clean illustrated
> icon, front view, soft directional shading with a subtle rim light, rich
> saturated colour, smooth gradients, crisp silhouette, readable at 76px,
> centred, transparent background, no drop shadow, no text, no background
> scenery, square 1024×1024.

### `nimbu-lemon.png`

> One whole Indian kagzi lemon on its own — small and nearly round, thin
> dimpled skin, mottled yellow-green with a slight blush of unripe green on
> one side, a short dry brown stem and a tiny leaf scar at the top. Fresh
> and firm. No thread, no beads, no chilies, no slice, no leaves. Clean
> illustrated icon, front view, soft directional shading with a subtle rim
> light, rich saturated colour, smooth gradients, crisp silhouette, readable
> at 76px, centred, transparent background, no drop shadow, no text, no
> background scenery, one object only, square 1024×1024.

The lemon gets no loop — it drops off and a fresh one rises, and a loop
would ride along with it.

---

## Daruma — 1 piece

### `daruma-body.png`

> A round red daruma doll, front on: a weighted egg-shaped body with no arms
> or legs, deep vermilion red with a gold-painted rim around the face, thick
> black painted eyebrows shaped like cranes and a heavy black moustache
> shaped like a tortoise, and gold calligraphic scrollwork on the belly.
> **Both eyes are large blank white circles with a thin black outline and no
> pupils** — empty, unpainted, waiting. Slightly coarse painted texture,
> like papier-mâché. At the top centre a small hanging loop moulded into the
> charm itself, a closed ring in the same material with its hole clearly
> open, no more than 10% of the total height, its top touching the top edge
> of the frame. Clean illustrated icon, front view, soft directional shading
> with a subtle rim light, rich saturated colour, smooth gradients, crisp
> silhouette, readable at 76px, centred, transparent background, no drop
> shadow, no text, no background scenery, one object only, square 1024×1024.

Empty eyes are the entire ritual — one pupil for the wish, one when it lands.
If a generator insists on painting them, that image is unusable.

Optional, if you would rather not use the vector pupils:

> A single black painted pupil alone — one solid circle of thick glossy
> black ink with a slightly irregular hand-painted edge, nothing else in the
> frame. Transparent background, no drop shadow, no text, square 1024×1024.

Save it twice, as `daruma-eye-l.png` and `daruma-eye-r.png`.

---

## Maneki-neko — 2 pieces

### `neko-body.png`

> A seated white maneki-neko cat facing forward: rounded body, upright
> pointed ears with pink inner ears, wide friendly eyes, whiskers, a red
> collar with a gold bell, and a red-and-gold bib. Its left paw rests flat
> on an oval gold koban coin at its side. **Its right shoulder is bare — no
> right foreleg and no raised paw at all**, the shoulder drawn smooth and
> complete as if the arm were simply absent. Glossy painted ceramic. At the
> top centre a small hanging loop moulded into the charm itself, a closed
> ring in the same material with its hole clearly open, no more than 10% of
> the total height, its top touching the top edge of the frame. Clean
> illustrated icon, front view, soft directional shading with a subtle rim
> light, rich saturated colour, smooth gradients, crisp silhouette, readable
> at 76px, centred, transparent background, no drop shadow, no text, no
> background scenery, one object only, square 1024×1024.

### `neko-paw.png`

> One cat foreleg and paw alone, cut off at the shoulder — glossy white
> ceramic with a pink paw pad, bent at the elbow and raised, the paw curled
> forward and down in the maneki-neko beckoning gesture. Nothing else in the
> frame: no cat, no body, no collar, no coin, no beads. Clean illustrated
> icon, front view, soft directional shading with a subtle rim light, rich
> saturated colour, smooth gradients, crisp silhouette, readable at 76px,
> centred, transparent background, no drop shadow, no text, square
> 1024×1024.

The paw is drawn to sit on the bare shoulder, so match its ceramic white and
its lighting to the body — generate the body first and describe it back.

---

## Scarab — 3 pieces

The wing cases lie closed over the body and part to reveal it, so the body must
be complete underneath and the two elytra together must cover it.

### `scarab-body.png`

> An Egyptian scarab beetle seen from directly above: broad semicircular
> head shield, a small pronotum, six segmented legs spread three to each
> side, and a **fully visible, uncovered, unobstructed abdomen** — the whole
> back drawn complete, with no wing cases and no shell over it, patterned in
> gold and dark carapace ridges. Deep lapis and gold faience. At the top
> centre a small hanging loop moulded into the charm itself, a closed ring
> in the same material with its hole clearly open, no more than 10% of the
> total height, its top touching the top edge of the frame. Clean
> illustrated icon, top-down view, soft directional shading with a subtle
> rim light, rich saturated colour, smooth gradients, crisp silhouette,
> readable at 76px, centred, transparent background, no drop shadow, no
> text, no background scenery, one object only, square 1024×1024.

### `scarab-wing-l.png`

> A single beetle wing case — one elytron alone, a long half-shell shaped
> like a teardrop cut down the middle: straight along its inner edge,
> curving out and tapering to a rounded point at the bottom. Iridescent
> teal-green chitin with a fine lengthwise ridge and a gold-edged rim,
> glossy. Nothing else in the frame — no beetle, no body, no legs, no second
> wing, no loop. Clean illustrated icon, top-down view, soft directional
> shading with a subtle rim light, rich saturated colour, smooth gradients,
> crisp silhouette, readable at 76px, centred, transparent background, no
> drop shadow, no text, square 1024×1024.

### `scarab-wing-r.png`

Same prompt, then **mirror it horizontally** rather than generating a second
one — two independently generated wings will not match and the closed shell
will look wrong.

---

## Before importing

Open `art-drop/` and look at the images against their filenames. Generators
hand files back in whatever order they finish and the names end up on the wrong
pictures — last time the lemon arrived as `daruma-body.png`. Then:

```sh
./import-art
sudocharm-reload
./shoot /tmp/art
```
