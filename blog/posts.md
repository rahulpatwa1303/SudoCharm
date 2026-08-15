# Where to post, and what to say

Two articles are drafted: `dev-to.md` (technical, the primary one) and
`medium.md` (narrative, lighter on code). Everything below is short-form.

**Publish dev.to first**, then set `canonical_url` on the Medium version to the
dev.to URL so search engines credit one of them rather than splitting between
two. Medium has an "import a story" flow that sets this for you.

## Read before posting

Both drafts now open on the same hook: every rotation animation in the extension
had never once run, silently, for the life of the project. That is true and it is
the best thing in either post — `ease()` builds a transition for
`rotation-angle-z` whose interval has no value type, so it interpolates nothing
and reports success. `turn()` in `charms.js` is the fix.

Before either goes out under my name:

- The dev.to post says the drag "cost more time than everything else" and that
  the tools were written late. Check that still reads as honest rather than as a
  humblebrag.
- Neither draft claims a number of days any more. Do not add one back unless it
  is true.
- The Medium version says "I write it in code review." Only keep that if I do.

---

## extensions.gnome.org

This matters more than any of the social posts, because it is where GNOME users
actually look for extensions. It is also the slowest — submissions are reviewed
by hand and it can take weeks.

Two things to sort out first:

1. **The UUID.** It is currently `sudocharm@rahulpatwa1303.github.io`. The convention for a
   published extension is a domain you control — `sudocharm@rahulpatwa1303.github.io`.
   Changing it means new GSettings paths and a logout, so do it before the first
   submission rather than after.
2. **Review takes the source seriously.** Reviewers read every line, and the
   hot-reload loader copying files into `.hot/` will draw questions. It is off
   without the `DEV` marker, but say so in the submission notes rather than
   making them work it out.

## Show HN

HN strips marketing, so keep the title flat. Two options — the first sells the
thing, the second sells the story. Post whichever matches what you want back:

> Show HN: SudoCharm – a good luck charm that hangs from your GNOME top bar

> Show HN: Every animation in my GNOME extension had never once run

Link the repo for the first, the article for the second. Then post the first
comment yourself:

> I saw Lucky Dangle, a Mac menu bar app that hangs a charm from your menu bar,
> and wanted it on Linux. Independent GNOME implementation — the code and artwork
> are mine, the idea is theirs.
>
> It is a real pendulum rather than a looping animation: the swing, the cord's
> elasticity and the charm's lag behind the cord are integrated every frame, so a
> flick makes it whip and a longer cord genuinely swings slower. Seven charms,
> each with a small ritual. The daruma paints one eye when you make a wish and
> the other when it lands, and remembers between reboots.
>
> The interesting part technically was everything that failed quietly. Rotations
> animated by `ease()` complete on schedule without ever changing the angle, so
> five of those rituals had never run and never errored. Dragging silently
> freezes on Wayland once the pointer leaves the hit area, for two independent
> reasons that each look identical from outside. Write-up: [link]
>
> Linux only, GNOME 45–48, GPL-3.0.

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

> Every animation in this thing had never once run. No errors, no warnings —
> they were starting and completing on schedule and moving nothing at all.
>
> It is a good luck charm that hangs off my desktop and does nothing useful.
> Fixing it taught me more than anything useful has this year.

Reply with the article link — a bare repo link performs badly there.

## LinkedIn

Only worth posting for the lesson, and only the honest version:

> Every animation in a side project of mine had never once run. Not on any
> machine, not once, for the life of the project.
>
> No errors. Nothing in the logs. The animations were starting. They were
> completing, on schedule, to the millisecond. The value they were animating
> simply never changed — the helper I was using cannot animate that particular
> property and reports success anyway.
>
> I had written five of those animations. I had watched all five not work. Every
> single time I concluded my own numbers must be wrong, because the system kept
> telling me the animation had run.
>
> That project had three bugs with the same shape. The animation reported
> success. The drag reported that it was dragging. My test reported that the
> angle was correct — it was comparing my arithmetic against my arithmetic, so it
> agreed with me all the way off a cliff.
>
> What fixed all of it was not thinking harder. It was two small tools, an hour
> each, that showed me the actual screen and the actual event count. I wrote them
> far too late.
>
> When you cannot see the failure, stop reasoning and go build the smallest thing
> that shows it to you.

## Assets to have ready

- **A GIF of the swing.** Nothing else sells this, and every one of the above is
  weaker without it. Grab it, pull it well out, let go, and let it settle —
  about four seconds.
- `docs/hanging.png` — freshly shot on a stock desktop with the current art and
  the beaded cord. Safe to post; the desktop icons are cropped out.
- `docs/charms.png` — the lineup of seven. **Stale — still the old artwork.**
  Reshoot before using it anywhere.
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
