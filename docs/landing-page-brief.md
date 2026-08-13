# Build the landing page for Topknot

## What Topknot is

A GNOME Shell extension for Linux. A good luck charm hangs on a cord from the
top edge of the screen, over the desktop, and sways. You can grab it and flick
it. It does nothing useful, and that is the entire point — it is a small
pleasant object that lives on your monitor.

Seven charms, each from a different tradition, each with its own small ritual.

Repo: `github.com/rahul/topknot` · Linux only, no other platforms planned.

## The one idea

**The page and the charm are the same object.**

A real charm hangs from the top of the viewport — not a picture of one, an
actual pendulum the visitor can grab and swing. Choosing a different charm
swaps the hanging object *and* re-skins the entire page to that charm's
palette. Pick the nazar and the page goes deep Turkish blue; pick the daruma
and it turns lacquer red and gold.

The charm is the navigation, the hero, and the demo simultaneously. A visitor
should understand what the product is by playing with the page for four seconds,
before reading a single word.

Do not build a page *about* a swinging charm. Build the swinging charm, and let
the page grow around it.

## The pendulum

Make it feel like the real thing. These are the actual constants from
`pendulum.js`; matching them means the page behaves exactly like the extension.

```
θ''       = −(g/L)·sin θ − damping·θ' + breeze(t)     the swing
stretch'' = −k·stretch − c·stretch' + ω²·L·0.06       the elastic cord
lag''     = −k₂·(lag − θ) − c₂·lag'                   the charm, on the cord
```

| | |
| --- | --- |
| gravity | `2600` (px/s², tuned by eye — real gravity at screen scale is far too slow) |
| damping | `0.55` |
| free swing limit | `1.05` rad; dragging may reach `1.5` |
| cord spring | `k = 150`, `c = 11` |
| lag spring | `k₂ = 95`, `c₂ = 8.5`, clamped to ±`0.55` rad |
| breeze | three sines: amplitude 2.1 / period 6.7s, 1.3 / 10.9s, 0.7 / 17.3s |

The three breeze periods do not divide into one another, so the idle drift never
visibly repeats. Keep that — a looping sway is the thing that makes these feel
cheap.

`L` is the **live** cord length, so a longer cord genuinely swings slower.

Behaviour that matters:

- **Drag tracks the pointer exactly**, in angle and distance. The cord
  stretches. Past roughly 55% of viewport height it should resist progressively
  rather than stop dead — it must never hit a wall while the cursor keeps going.
- **Release mid-swipe throws it** at the speed the hand was moving. Sample the
  angular velocity during the drag; do not just drop it.
- **The charm lags behind the cord**, so a flick makes it whip. This is a
  second, looser spring, and it is most of what sells the weight.
- **Touch and mouse both**, with the same feel.

## The charms

Palettes are sampled from the actual artwork, so they will match the images.

| Charm | Origin | Ritual | Key | Accent | Page tint | Deep |
| --- | --- | --- | --- | --- | --- | --- |
| Nazar boncuğu | Turkey | Flick it and it spins | `#000080` | `#60c0e0` | `#d1d1e8` | `#000035` |
| Hamsa | Middle East & North Africa | The eye wakes | `#006060` | `#008080` | `#d1e2e2` | `#002828` |
| Nimbu-mirchi | India | The old lemon drops off, a fresh one rises | `#e0c000` | `#c00000` | `#f9f3d1` | `#5e5000` |
| Daruma | Japan | Paint one eye for the wish, the other when it lands | `#800000` | `#a06000` | `#e8d1d1` | `#350000` |
| Maneki-neko | Japan | Three beckons | `#e0e0e0` | `#c08000` | `#f9f9f9` | `#5e5e5e` |
| Horseshoe | Europe | A flip and a bounce | `#402020` | `#402000` | `#dcd6d6` | `#1a0d0d` |
| Scarab | Egypt | The wing cases part | `#004020` | `#006040` | `#d1dcd6` | `#001a0d` |

Treat these as a starting point, not a straitjacket — they are honest sampled
values and some need a designer's hand to become a usable palette. The
maneki-neko is nearly white and the horseshoe nearly black; both will need more
care than the others.

The theme transition when switching charms should be felt, not watched.
Somewhere around 400–600ms, eased. The charm itself should react — a small
swing, as though the new one was just hung.

## Assets

`icons/` in the repo, 512×512 PNG with transparency:

```
nazar.png       hamsa.png       horseshoe.png
nimbu-string.png + nimbu-lemon.png        (two pieces)
daruma-body.png + daruma-eye-l.svg + daruma-eye-r.svg
neko-body.png   + neko-paw.png            (two pieces)
scarab-body.png + scarab-wing-l.png + scarab-wing-r.png
```

Every layer of a charm is drawn on the same square canvas, so stacking them at
identical size puts each piece in the right place with no per-charm maths. That
is what makes the rituals possible on the web too, if you want them: the lemon
can fall off, the daruma's eyes can be painted one at a time, the wing cases can
part.

Doing even one ritual on click would be a strong touch. The daruma is the best
candidate — click it, it paints one eye; click again, the other.

There is also `docs/hanging.png`, a real screenshot of it in use on a desktop.

## Layout

**Mobile first.** Most people will meet this on a phone.

- The charm hangs from the top of the viewport, large, and is the first thing
  seen. It must be draggable with a finger.
- A horizontal, thumb-reachable row of charm pickers — small circular swatches or the
  charm images themselves. Tapping one swaps the hanging charm and the theme.
- Everything else stacks in one column below.
- Do not make the visitor scroll to discover that the charm is interactive.
  Hint at it — a slow idle sway does most of that work by itself.

**Laptop and desktop.** Required, not an afterthought.

- More horizontal room: the charm can hang in its own column with copy beside
  it, or hang centrally with content flowing around.
- The charm should hang from the very top of the viewport, ideally from
  something that reads as the edge of a screen — echoing where it really lives.
- Hover states, cursor changes on the charm (grab / grabbing).

No fixed breakpoint list is being prescribed. Use judgement.

## Content

Words to work from. Edit them; do not pad them.

> **Topknot** — A good luck charm, knotted to the top of your screen.

> It hangs there over your desktop and sways. Grab it and it swings — the cord
> stretches while you pull and whips when you let go, because it is an actual
> pendulum rather than a looping animation. Call it down and it performs a small
> ritual belonging to that particular charm.

> It does nothing useful. That is the entire point.

The daruma detail is worth its own moment somewhere on the page:

> Call it down once to make a wish and it paints its left eye. Call it again
> when the wish lands and it paints the right. That state survives reboots,
> which means the doll on your screen is keeping score.

Install, shown plainly:

```sh
gnome-extensions install --force topknot@rahul.local.shell-extension.zip
gnome-extensions enable topknot@rahul.local
```

Needs: a download button, a GitHub link, "GNOME Shell 45–48, Wayland or X11",
and an honest "Linux only" line. Do not hide the platform limitation in a
footnote — the people who can use this will respect being told immediately.

Also worth a line: it can be triggered from a script, so a git hook can bless a
commit. Developers find that funnier than it deserves.

## Constraints

- **One self-contained HTML file.** Inline CSS and JS, images as `data:` URIs or
  a local `assets/` folder. No CDN, no external fonts, no network requests. It
  must work opened from a file:// path with no connection.
- **No framework.** The whole page is one animated canvas or SVG plus some text.
  React here would be heavier than the thing it describes.
- **60fps on a mid-range phone.** The physics is trivial arithmetic; the risk is
  layout thrash. Drive the charm with transforms only, never by changing layout
  properties.
- **Respect `prefers-reduced-motion`.** Stop the idle breeze and hold the charm
  still. Dragging can still work — that is user-initiated.
- **Respect `prefers-color-scheme`.** Each charm needs a light and a dark
  treatment; the sampled tint and deep columns above are a starting point for
  exactly that.
- **Accessible.** The charm switcher must be real buttons, keyboard reachable,
  with visible focus and sensible labels. The hanging charm needs an `alt`
  equivalent. Someone using a screen reader should be able to read the page and
  install the thing without ever touching the toy.

## Avoid

- The generic SaaS landing page. No feature grid of three icons, no pricing
  table, no testimonials, no "Trusted by" logos, no gradient mesh blobs.
- Explaining the joke. The page should be dry and let the object be charming.
- A hero that is a static screenshot. The screenshot exists, but the live
  pendulum is the reason to visit.
- Scroll-jacking, parallax layers, or an intro animation between the visitor and
  the charm.
- Emoji as decoration.

## Done looks like

Someone opens it on a phone, sees a charm swinging, drags it out of curiosity,
watches it swing back, taps through three charms to see the page change colour,
and *then* reads what it is. They should want it on their machine before they
have finished reading.
