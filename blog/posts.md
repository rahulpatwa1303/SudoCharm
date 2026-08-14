# Where to post, and what to say

Two articles are drafted: `dev-to.md` (technical, the primary one) and
`medium.md` (narrative, lighter on code). Everything below is short-form.

**Publish dev.to first**, then set `canonical_url` on the Medium version to the
dev.to URL so search engines credit one of them rather than splitting between
two. Medium has an "import a story" flow that sets this for you.

## Read before posting

A few lines in the drafts are claims about me rather than about the code, and I
should make sure they are true before they go out under my name:

- dev.to says the physics "was an afternoon" and the tools were written late.
- Medium says "every developer I have shown this to finds it funnier than it
  deserves" — that should be true of actual people, or it should go.
- Both say the drag cost more time than everything else. It did, but check the
  phrasing still reads as honest rather than as a humblebrag.

---

## extensions.gnome.org

This matters more than any of the social posts, because it is where GNOME users
actually look for extensions. It is also the slowest — submissions are reviewed
by hand and it can take weeks.

Two things to sort out first:

1. **The UUID.** It is currently `sudocharm@rahul.local`. The convention for a
   published extension is a domain you control — `sudocharm@rahulpatwa1303.github.io`.
   Changing it means new GSettings paths and a logout, so do it before the first
   submission rather than after.
2. **Review takes the source seriously.** Reviewers read every line, and the
   hot-reload loader copying files into `.hot/` will draw questions. It is off
   without the `DEV` marker, but say so in the submission notes rather than
   making them work it out.

## Show HN

Title — HN strips marketing, so keep it flat:

> Show HN: SudoCharm – a good luck charm that hangs from your GNOME top bar

Link to the repo, not the article. Then post the first comment yourself:

> I saw Lucky Dangle, a Mac menu bar app that hangs a charm from your menu bar,
> and wanted it on Linux. This is an independent GNOME Shell implementation —
> the code and artwork are mine, the idea is theirs.
>
> It is a real pendulum rather than a looping animation: the swing, the cord's
> elasticity and the charm's lag behind the cord are integrated every frame, so
> a flick makes it whip and a longer cord genuinely swings slower. Seven charms,
> each with a small ritual — the daruma paints one eye when you make a wish and
> the other when it lands, and that survives reboots.
>
> The interesting part technically was input. It has to draw over every window
> and take none of your clicks, which on Wayland an ordinary application cannot
> do — so it is a shell extension with a monitor-sized layer outside the input
> region plus two small tracked hit areas. Dragging then broke in a way I
> diagnosed wrong three times; write-up here if that is your kind of thing: [link]
>
> Linux only, GNOME 45–48, no other platforms planned.

Expect the top comment to be about whether the name is a good joke. It is fine.

## Reddit

**r/gnome** — the most likely to actually install it. Lead with the extension,
not the article.

> Title: SudoCharm – a good luck charm that hangs from the top bar and swings
>
> A GNOME Shell extension I built after seeing a Mac app do the same thing. It
> hangs a charm on a cord below the top bar, sways in a breeze that never quite
> repeats, and you can grab it and flick it — it is an actual pendulum, so the
> cord stretches while you pull and whips when you let go.
>
> Seven charms from seven traditions, each with its own ritual. It draws over
> everything and takes none of your clicks, so it stays out of the way.
>
> GNOME 45–48, Wayland or X11, GPL-3.0. Not on extensions.gnome.org yet —
> zip and source on GitHub.

**r/linux** — same, but the write-up is the better hook here. Post the article
and mention the extension in it.

**r/unixporn** — screenshot or GIF only, and it needs to be a good desktop, not
a bare one. Rules require a comment with the details:

> Distro / DE / theme, then: charm is SudoCharm, an extension I wrote —
> [github link]

**r/opensource** — fine, low traffic, no special framing needed.

## lobste.rs

Post the **dev.to article**, not the repo — lobste.rs prefers writing over
launches. Tags: `linux`, `javascript`. Add an authored-by-me note in the
submission.

## Mastodon (fosstodon / floss.social)

The Linux crowd is genuinely here and it is the best fit for this project.
Attach a GIF of the swing.

> I have hung a good luck charm from the top of my screen.
>
> SudoCharm is a GNOME Shell extension — a nazar bead, or a daruma, or a
> nimbu-mirchi — on a cord, swaying, over the desktop. It is a real pendulum, so
> you can grab it and flick it and the cord whips.
>
> It does nothing useful. That is the entire point.
>
> GPL-3.0, GNOME 45–48 → github.com/rahulpatwa1303/SudoCharm
>
> #Linux #GNOME #FOSS

## X

> Spent a week making a good luck charm swing correctly on my Linux desktop.
>
> It does nothing useful. The cord stretches when you pull it and whips when you
> let go, because it is an actual pendulum rather than a looping animation.
>
> Seven charms, each with a ritual. GPL-3.0.

Reply with the article link — a bare repo link performs badly there.

## LinkedIn

Only worth it for the debugging lesson, and only if it is the honest version.
Nobody needs another post about a swinging bead, but the point underneath it
travels:

> I lost more time to one bug on a hobby project than to anything at work this
> month, and the cause was that I kept reasoning about behaviour I could not
> observe.
>
> A charm hanging from my desktop would not drag correctly. I diagnosed it wrong
> three times — each fix was defensible, each one changed nothing.
>
> What ended it was not thinking harder. It was a counter. I added one number to
> a debug line: how many motion events had actually arrived. If it climbed while
> the angle stayed frozen, my maths was wrong. If it stayed frozen, the events
> were not arriving at all. From the outside those two states look identical,
> and every wrong answer I gave was a guess about which one I was looking at.
>
> The tool took under an hour. I wrote it near the end.
>
> When you cannot see the failure, stop reasoning and go build the smallest
> thing that shows it to you.

## Assets to have ready

- **A GIF of the swing.** Nothing else sells this, and every one of the above is
  weaker without it. Grab it, pull it well out, let go, and let it settle —
  about four seconds.
- `docs/hanging.png` — the existing screenshot, for anywhere a still will do.
- `docs/charms.png` — the lineup of seven, good as a second image.
- The landing page, once GitHub Pages is on: `docs/` on `main`.

## Order

1. Cut a GitHub release with the zip attached — every link below is worthless
   without a download.
2. Turn on GitHub Pages (Settings → Pages → `main` / `docs`).
3. Record the GIF.
4. dev.to, then Medium with the canonical URL set.
5. Mastodon and r/gnome the same day.
6. Show HN the following morning, US time.
7. Submit to extensions.gnome.org whenever the UUID question is settled — it is
   slow, so earlier is better.
