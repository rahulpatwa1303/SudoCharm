# Charm artwork as SVG — the rules the code imposes

[CHARM-PROMPTS.md](CHARM-PROMPTS.md) says what each charm *looks* like. This says
what every file has to satisfy to work in the extension at all. A piece that
breaks one of these is not a style problem — it is broken.

## The canvas

```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
```

Exactly this. `CANVAS = 128` in `charms.js` and every pivot in the code is a
fraction of it.

**Every layer is full-canvas.** A charm with a ritual is several files stacked
on the same 128×128 grid, so each part must be drawn *where it finally sits* —
not centred in its own file. The lemon is drawn at the bottom of the canvas, the
cat's paw up at the right shoulder, the wing cases over the beetle's back. This
is what lets a ritual move a part relative to where it was drawn.

## What renders it

`St.Icon` → `Gio.icon_new_for_string` → **librsvg**. Not a browser. Stay inside
this subset:

| Use | Do not use |
| --- | --- |
| `path` `circle` `ellipse` `rect` `polygon` `line` | `<style>` blocks, CSS classes |
| `linearGradient` `radialGradient` `stop` | `filter`, `feGaussianBlur`, `feDrop*` |
| `g`, `transform`, `opacity`, `fill-opacity` | `mask`, `clipPath` unless truly needed |
| presentation attributes (`fill=` `stroke=`) | external files, fonts, `<text>`, `<script>` |

Gradient `id`s must be unique **within** a file. Prefix them with the layer name
(`nazar-glass`, `scarab-elytron`) so a stack of layers can never collide.

No drop shadows. No background rect — transparency is the background.

## The hanging loop

Every piece that hangs from the cord — `nazar`, `hamsa`, `horseshoe`,
`nimbu-string`, `daruma-body`, `neko-body`, `scarab-body` — ends in a closed
ring at top centre, moulded in the charm's own material:

```
hole centre      (64, 8)      exactly — the code hangs the charm from this point
hole radius      about 4
ring outer edge  about 8      so the ring occupies y = 0 .. 16
```

The ring's top must touch `y = 0`. The hole must be genuinely open — the cord's
last bead is drawn sitting in it, and you see through it.

The charm's own body starts just below, around `y = 14`, and runs to `y ≈ 126`.

**Never put a loop on** `neko-paw`, `scarab-wing-l`, `scarab-wing-r`,
`nimbu-lemon`, `daruma-eye-l`, `daruma-eye-r`. Those move during a ritual and
would drag a loop around with them.

## Pivots the rituals turn parts about

These are set in `charms.js` and the art has to agree with them, or a ritual
rotates the part about the wrong place:

| Layer | Pivot (fraction) | In canvas units | What has to be there |
| --- | --- | --- | --- |
| `nimbu-lemon` | 0.50, 0.60 | (64, 77) | the lemon's own centre |
| `neko-paw` | 0.54, 0.64 | (69, 82) | the shoulder joint the foreleg turns about |
| `scarab-wing-l` | 0.50, 0.31 | (64, 40) | the hinge at the top inner corner of the elytron |
| `scarab-wing-r` | 0.50, 0.31 | (64, 40) | same point, mirrored |
| every hanging piece | 0.50, 0.0625 | (64, 8) | the centre of the hanging loop's hole |

## Stacking order

Layers paint in the order `charms.js` lists them; later ones sit on top.

| Charm | Order | Requirement |
| --- | --- | --- |
| nimbu | `string`, `lemon` | chilies fill the top ~0.66; the lemon hangs at the bottom |
| daruma | `body`, `eyeL`, `eyeR` | the body's two eye sockets are **blank white**; the pupils are separate files that land exactly inside them |
| neko | `body`, `paw` | the body's **right shoulder is bare**; the paw covers it |
| scarab | `body`, `wingL`, `wingR` | the abdomen is drawn complete; the two elytra **together cover it** at rest and part to reveal it |

## Readable at 50 pixels

It is drawn at whatever `charm-size` is set to — currently 50. Detail finer than
about 1.5 canvas units disappears. Shape and silhouette carry it; texture does
not survive.

## Checking a piece

```sh
rsvg-convert -w 50 -h 50 icons/nazar.svg -o /tmp/t.png   # does librsvg accept it
./shoot /tmp/art                                          # what it looks like hanging
```
