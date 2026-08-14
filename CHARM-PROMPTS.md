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

The last batch failed here and it is worth knowing why before regenerating. The
body was asked for with a bare shoulder and came back as a **complete cat with
both forelegs** — one down the chest on the viewer's left, one resting on the
koban on the viewer's right. A raised paw laid on top of that gives the cat
three front legs, and there is no placement or layer order that hides it:

| paw over the body | the severed end shows as a pink oval hanging in mid-air |
| --- | --- |
| paw behind the body | no stump, but the arm passes behind the head — it reads as a hand floating by the face, and slides under it as it moves |

So the absence has to be real. The wording below is blunt about it on purpose,
and **the one thing to check before importing** is that the viewer's-left
shoulder is genuinely empty.

Sides are given as *you look at the picture*, never as the cat's own left and
right, because that is the other way round and is what gets confused.

### `neko-body.png`

> A seated maneki-neko lucky cat figurine facing forward, glossy white porcelain
> with fine gold outlines. Large amber eyes with bright highlights, small gold
> eyebrow flicks, a pink nose, a smiling red mouth, gold whiskers, and upright
> pointed ears with red inner ears. A red collar patterned with gold flowers,
> with a large gold bell hanging at the throat. Red cherry blossoms and gold
> cloud scrollwork on its haunches, and hind paws with gold toe lines at the
> bottom. A large upright oval gold koban coin, engraved with a sakura, rests
> against its chest on the RIGHT-HAND SIDE OF THE PICTURE, with one white paw
> resting flat on top of the coin holding it there.
>
> **The other foreleg — the one on the LEFT-HAND SIDE OF THE PICTURE — must be
> completely absent.** No leg, no paw, no raised arm, no shoulder joint, no
> hint of one. Draw that whole side as a smooth unbroken finished curve of
> white porcelain, exactly as though the figurine had been sculpted with only
> one front leg and the other side left plain. Do not raise a paw there. Do not
> rest a second paw anywhere. Do not suggest an arm behind the body. That space
> must be empty porcelain, because a separate raised arm is placed onto it
> afterwards and anything drawn there will collide with it.
>
> At the top centre a small hanging loop moulded into the figurine itself, a
> closed ring in white porcelain with a thin gold rim and its hole clearly open,
> no more than 10% of the total height, its top touching the top edge of the
> frame. Clean illustrated icon, front view, soft directional shading with a
> subtle rim light, rich saturated colour, smooth gradients, crisp silhouette,
> readable at 76px, centred, transparent background, no drop shadow, no text,
> no background scenery, one object only, no cord and no beads, square
> 1024×1024.

### `neko-paw.png`

The arm is drawn **in front of** the body, so its cut end lands on the bare
shoulder. That end must be plain white — a pink cross-section reads as a
severed limb, which is exactly how the last one looked.

> A single cat foreleg and paw alone, cut off at the shoulder, raised in the
> maneki-neko beckoning gesture — the upper arm rising up and to the LEFT, bent
> at the elbow, the paw at the top curled forward and slightly down with a soft
> pink pad and gold toe lines. Glossy white porcelain with fine gold outlines
> and soft cool-grey shading, matching a white porcelain cat exactly.
>
> It must read as a plump, rounded, chubby ceramic limb — thick and heavy the
> whole way, never a thin stick with a ball on the end. The paw is noticeably
> wider than the arm.
>
> Where it is cut off at the shoulder, the cut end is **plain white porcelain,
> shaded like the rest of the limb — no pink, no red, no cross-section, no
> wound, no visible join.** That end is covered by the body when assembled.
>
> Nothing else in the frame: no cat, no head, no body, no collar, no bell, no
> coin, no loop. Clean illustrated icon, front view, soft directional shading
> with a subtle rim light, rich saturated colour, smooth gradients, crisp
> silhouette, readable at 76px, transparent background, no drop shadow, no
> text, square 1024×1024.

### Check both before importing

1. Is the **left-hand side of the body picture** genuinely bare porcelain, with
   no leg and no paw? If not, the image is unusable — regenerate it.
2. Does the body have exactly **one** front paw, on the koban?
3. Is the paw's cut end **white**, with no pink?
4. Is the loop's hole actually open, so you can see through it?

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
