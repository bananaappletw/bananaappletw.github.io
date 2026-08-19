# Torchlight — status and handoff

**Last updated:** 19 August 2026
**Branch:** `main` — work goes straight to `main` and a push is the deploy.
**State:** **released and live** at <https://bananaappletw.github.io/>. The
direction is settled: B — Ash (§1).

Read this first, then [`design.md`](./design.md) for the spec, [`tokens.json`](./tokens.json) for colour, and [`scenes.md`](./scenes.md) for the five per-page vignettes (briefs written, art not made).

---

## 1. The decision — settled

The theme was built, then rebuilt on FromSoftware's design language, then iterated several times on vague feedback ("looks weird", "doesn't feel natural", "looks dirty"). That was inefficient, so the work paused and prototypes were made instead, for a pick — three at first, then five.

**Prototype page (five):** https://claude.ai/code/artifact/a848c7a3-f4f0-47ce-9ff4-e50e72666d97
**Source, committed:** [`prototypes/five-directions.html`](./prototypes/five-directions.html) — open it directly in a browser. Fonts are not inlined in the committed copy, so it falls back to Georgia; run the site's build and inline `dist/_astro/fonts/*.woff2` if you need Cinzel and Spectral exactly.

|       | Direction        | Character                                                                              | Trade-off                                                                 |
| ----- | ---------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **A** | Item Description | The page is a Souls menu panel: framed, translucent, hairline rules, flavour text last | Strongest identity; the frame costs horizontal room and can feel boxed-in |
| **B** | Ash              | No panels, no borders, no chrome. A narrow column in a dark room, lit from above       | Best for long reads; least obviously themed at a glance                   |
| **C** | Illuminated      | The manuscript: warmer ground, centred title, gold rules, drop cap, fleurons           | Closest to Anor Londo and the fairy-tale note; dates fastest if overdone  |
| **D** | Datasheet        | darksouls.jp's own product page: spec block, left rail, hairlines, zero ornament       | Survives the light world losing nothing; weakest on atmosphere            |
| **E** | Stained Glass    | Arched header inside a shaft of light; the arcane register carries the second voice    | Memorable; the arch is the one device here that could age badly           |

**B — Ash was chosen on 16 August 2026.** The branch had been closest to B with pieces of A bolted on, and that hedge is why it never settled. The A and C devices have now been removed rather than left unused — see [`design.md` §0](./design.md) for the list and the reasoning.

---

## 2. What is built and working

Everything below is on `main`, live, builds clean, and is verified:

- `npm run build` — succeeds
- `npx astro check` — 0 errors, 0 warnings
- `npm test` — 20/20 pass
- `npm run format:check` — passes
- `npm run lint` — passes; flat config added 19 August 2026 (§6).

**Applied to:** base layer and atmosphere, typography, header (HUD), cards, tags, pagination, breadcrumbs, footer, home, post, section pages, 404, list, search, Shiki, Mermaid, OG images, and the bonfire.

**Preserved from AstroPaper** (restyled, not reimplemented): RSS, sitemap, dynamic OG images (25), Pagefind search (27 files), tags, archives, pagination. All verified present in `dist/`.

---

## 3. Architecture

```
docs/theme/tokens.json      ← single source of truth for colour
        │
        ├── scripts/build-tokens.mjs → src/styles/tokens.css   (generated, committed, never hand-edit)
        ├── astro.config.ts          → Shiki themes, both worlds
        ├── src/components/Mermaid.astro → diagram theme
        └── src/utils/ogTemplate.ts  → social cards (always hollowed)

tests/tokens.test.ts        ← enforces contrast floors, the ceiling,
                              the ornament channel, and NO HEX IN src/
```

**Two worlds, not light/dark:** `hollowed` (default, warm sepia) and `kindled` (white). `data-theme` accepts `hollowed`/`kindled` plus `dark`/`light` aliases. First visit always lands hollowed — `src/scripts/world.ts`, and the inline FOUC script in `Layout.astro`.

**Key files**

| File                                                          | Role                                               |
| ------------------------------------------------------------- | -------------------------------------------------- |
| `src/styles/global.css`                                       | base layer, atmosphere (`.air`, `.grain`)          |
| `src/styles/typography.css`                                   | prose scale; `h1` and `h2` share a rule (see §5)   |
| `src/styles/ornament.css`                                     | eroded rule, label, rune bullet, flame             |
| `src/scripts/world.ts`                                        | world switching and persistence (flip is instant)  |
| `src/components/Header.astro`                                 | the HUD                                            |
| `src/pages/posts/[...slug]/_components/BackToTopButton.astro` | the bonfire                                        |
| `torchlight.config.ts`                                        | site config (renamed from `astro-paper.config.ts`) |

---

## 4. Design decisions already made — do not relitigate

Each of these was reached the hard way. Reasons are in `design.md`; summarised so a fresh session does not undo them.

1. **Gold appears at most three times per viewport.** A count, not a percentage. An earlier 8%-area budget was permissive enough to allow gold on every link, tag and nav item and still pass. Links are neutral until hovered.
2. **Hollowed is warm sepia, not cold ash.** Built on the Dark Souls Remastered ramp; the ground sits a step below its darkest value, at `#100f0d`. Souls _looks_ cold, so cold blue-grey feels right and is wrong — the series is desaturated _brown_.
3. **Contrast has a ceiling as well as a floor.** `--text` targets 8–13:1, never above 14:1. Maximum-contrast text detaches and reads as glowing rather than printed. Borders sit near 1.3:1 for the same reason.
4. **Ornament reads `--ornament`, never `--torch`**, and `--ornament` is `--text-4` in _both_ worlds — bone on the dark ground, warm grey on paper. It was gold when kindled until 19 August: twenty gilded bullets on the about page is the exact failure rule 1 exists to prevent. Asserted by test, in both directions.
5. **Drop caps, section marks and carved frames were cut.** With two ornaments per viewport, space and light do the work better.
6. **The roguelike/terminal direction was considered and declined** (`design.md` §14). The escape hatch, if ever wanted, is a single `>` for "read more".
7. **One family, no capitals.** Cardo sets everything — display and body. Cinzel was the obvious pick (Dark Souls uses Optimus Princeps, and Cinzel is the closest OFL relative) and it was wrong: it is a capitals face whose lowercase sprawls, which forced every title into small caps to hide it. Nothing on the site is set in capitals now, because capitals are slower to read. See `design.md` §5 for the full history.
8. **Check the weights a face actually ships.** Asking for a weight a family does not have gets you a synthesised fake bold — and breaks the build outright, because `ogTemplate.ts` resolves fonts _by weight_. That generator names its families by role rather than by typeface for the same reason.

---

## 5. Traps found the hard way

These cost real time. All are recorded in `design.md` §13 as anti-patterns.

- **Tailwind hoists `position: fixed` and `inset: 0` into utilities and strips them from hand-written rules.** The entire atmosphere shipped unpositioned before this was caught. `.air` / `.grain` apply them as classes in `Layout.astro` instead.
- **`body > * { z-index: 1 }` is load-bearing.** `.air` and `.grain` are positioned, so they paint above any _non-positioned_ content.
- **Grain must sit behind the content.** At `z-index: 2` it rendered every glyph through noise — that is what read as "dirty".
- **An SVG `<mask>` is luminance by default; CSS `mask-image` is alpha.** Black stops are correct in CSS and mean "hide everything" in an SVG mask. The first build of the Approach scene rendered as a blank rectangle.
- **The DOM is not the source of truth for the world.** Astro's ClientRouter replaces `<html>`'s attributes on every client-side navigation and inline head scripts do not re-run, so reading `data-theme` reset the reader's choice on every click. localStorage is authoritative.
- **Anything that re-runs on navigation may restore state but must never bind listeners.** Binding inside `astro:after-swap` stacked one listener per page visited.
- **Font sizes are a property of the face.** The scale went up 15% when the family changed, with no design intent changing — Cardo's x-height is shorter than Spectral's, so identical numbers render visibly smaller.
- **`getFontPathByWeight` was broken** (now fixed): Astro emits one `FontData` entry per (weight, style, format), so `.find()` matched woff2 then looked for truetype inside it. OG generation could not have worked.
- **12 of 25 posts use `# ` for section headings**, not titles. `h1` and `h2` are styled identically in prose; without that, posts render as several stacked giant titles.
- **All 25 posts have `description === title`**, so `Card.astro` suppresses the description when it matches.
- **An SVG arc cap's sweep flag is `0`, not `1`.** The sweep flag is a positive-angle direction in a y-down system, so `1` bends the cap the wrong way and takes a bite _out_ of the end of every stroke. On a long stroke it is a subtle notch; on a short one it dominates, and the sun's rays rendered as ragged slabs until it was found.
- **Google Fonts is blocked on the sandbox this branch was last built in.** `fonts.google.com/metadata/fonts` returns 403 through the egress proxy, so `unifont` resolves zero files, `fontData` comes back as empty arrays, and `npm run build` dies in the OG template with "Cannot find the font path". Nothing in the repo is wrong — it builds on a machine that can reach Google. Do not "fix" `getFontPathByWeight` in response to this error.

---

## 6. Also fixed along the way

- `editPost.url` pointed at `satnaing/astro-paper` — every "edit this post" link sent readers to someone else's repository.
- `i18n/types.ts` was missing `list`, which `en.ts` defined and `Breadcrumb` used.
- The List page lost its nav entry during the header rebuild; restored.
- `list.astro` referenced three removed custom properties and carried a four-colour category palette.
- The repo had no prettier config, so `npm run format` reformatted untouched files. Conventions pinned in `.prettierrc.json`; `tokens.css` is in `.prettierignore` because the generator owns it.
- The site description was the title again, so every search result and social
  card read "Weibo's Home" twice. It says what the site is about now.
- **Court** shipped to the archive — three faded banners on a rail, one
  charged with a cross. Two things it turned on: the hem is the whole
  silhouette (straight-cut, a banner reads as a blind, and the first version
  was three vertical bars), and the crimson is halved in the kindled world,
  because paper takes a dye far harder than a dark ground does. It also moved
  Clerestory off the archive: `scenes.md` §3.3 had assigned Court to "archive /
  tags", which §3.2 had already given away.
- **`--blood` is now allowed in the scene layer**, Court only — `design.md` §4
  carries the amendment and `scenes.md` §4 the reasoning. It is semantic in the
  interface and free in a painting, because nothing in a painting has a state.
- **Drowned** shipped to the 404 — a leaning ruin standing in a lake under a
  cold moon, no gold in it. Two things it turned on, both in `scenes.md` §3.5:
  a lean has to be a rotation rather than a shear, because the eye reads lean
  from the angle against the waterline; and the reflection is sampled from the
  silhouette band by band, never mirrored. **The lake footer prototype is
  closed by this**, not built: `the-lake.html` reflects the footer text in
  water on the same page that now has a lake in the corner, and two water
  treatments on one page is one too many.
- Kindled painted every rune bullet gold, because `--ornament` equalled
  `--torch` there — twenty of them on the about page. Pseudo-element paint is
  invisible to a naive audit of computed styles, which is how it survived this
  long. `--ornament` is `--text-4` in both worlds now.
- The about page was never inside the measure: `app-prose` sat on `<Main>`,
  which is also `app-layout`, and that utility's `max-width: var(--hall)` won.
  The page was set to 1024px — about 80 characters — and centred, while every
  post ran at 66ch. The class goes on an inner element now.
- The kindled scene was four points of lightness from the paper at
  `--scene-opacity: 0.4` — the same drawing in the dark carries twenty — so
  the whole vignette read as a smudge. It is 0.66 now, near hollowed's 0.62.
  Ink on paper needs about the weight light needs in the dark.
- Archive entries were shrink-to-fit, so each month's rules ended at that
  month's longest title and the page read as a ragged stack. The list is
  `flex-1` now and every rule ends at the hall's edge.
- `npm run lint` had no config to read. `eslint.config.js` is flat config now:
  ESLint's recommended set, `eslint-plugin-astro`, and the TypeScript-aware
  `no-unused-vars` in place of the core rule, which reads a parameter name in
  a _type_ position as a dead binding and flagged six of them. No type-aware
  rules — `astro check` already does that pass, and a second one would double
  the cost. It found one real thing: `slugifyStr` tested for non-Latin text
  with a literal control-character range, now `\p{ASCII}`.

---

## 7. Roadmap

v1 is **shipped**. The theme was squash-merged to `main` on 16 August 2026 and
deploys automatically on every push. Work continues directly on `main`; there
is no feature branch.

### Shipped since the release

- **The palette settled.** Ground dropped to `#100f0d`, a step below the Dark
  Souls ramp's darkest value — every ink level gains about a point of contrast.
- **One type family: Cardo**, for display and body alike, replacing
  Cinzel → Marcellus → Cardo and dropping Spectral entirely. **No capitals
  anywhere.** See `design.md` §5 for why each face was replaced.
- **The scale is fluid**, solved at 375px and 960px, and was raised 15% when
  the family changed — Cardo's x-height is shorter than Spectral's, so the same
  numbers read smaller. A further 20% went on top of that and came back off on
  19 August: at 30px the prose filled the hall and the post had no air in it.
  The hall stayed at 64rem, so the smaller type reads as more room around the
  column. Prose is **left-aligned** in the hall now, not centred — at 66ch it is
  narrower than the hall, and centring it alone gave the page two left margins.
- **The hall is 60rem**, and the atmosphere's geometry now tracks the column
  rather than the viewport.
- **The world flip is instant** — the veil is gone.
- **Three marks**: a carved sigil for the site, a sun and moon for the world
  control, a rune for the edit link.
- **Four scenes**: **Approach** on the home page, **Clerestory** behind posts
  and tags, **Court** on the archive and **Drowned** on the 404, all generated
  pen drawings. Clerestory is built in
  one-point perspective, which is what makes that much architecture affordable.
- **The four marks are drawn, not stroked.** `src/utils/nib.ts` takes a spine
  and a pressure profile and returns the outline a nib would have left, so the
  sigil, world control, edit rune and bonfire are filled shapes with varying
  width rather than uniform strokes. Geometric exactness was what read as cheap
  next to the scene drawings — not the shapes, the evenness of the line.
- **Breadcrumbs** replaced the back link on posts; the gate leads with the title.

### Open, in the order worth taking them

1. **The kindled world had its pass** on 19 August, page by page at 1440 and
   390 against the same page hollowed. Two things came out of it: the scene
   was invisible on paper (§6) and the archive rules were ragged (§6). What
   the pass also established, so nobody re-opens it: gold now stays inside its
   budget in both worlds — the only torch paint left on a page is the sigil and
   the world control, both marks, once the kindled ornament channel stopped
   being gold (§4 rule 4); the mottling that appears on a white page in a
   screenshot is the viewer's compression, not the grain, which measures 253
   to 255 across an empty region; and `pre` scrolls rather than clips, which
   is invisible in a headless shot because the overlay scrollbar does not
   render. Still open there: **the kindled world has never been looked at on a
   real screen**, only in captures.
2. **The last scene — Rest**, on the about page. It is the hard one and may not
   be a pen drawing at all: [`scenes.md`](./scenes.md) §7 records that this
   approach produced usable architecture and unusable figuration, and a seated
   knight is figuration. The other four are built.
3. **Ash variations and the stain texture.** Soot ground, ruled headings,
   mincho and the spec block are all prototyped and none is chosen. The stain
   must ship un-tiled — a repeat is visible on a wide screen — and its dials
   are in `stain-calibration.html`.
4. **The post header image rule** (`design.md` §15).
5. **Review the `about` page prose** against the measure. The measure itself is
   fine at the smaller scale; what is left is the writing — and the coloured
   emoji in "Let's Connect", which are the only full-saturation pixels on the
   site.

---

## 8. Useful commands

```bash
npm run dev            # regenerates tokens, then serves on :4321
npm run build          # tokens → astro build → pagefind
npm test               # contrast floors, ornament channel, no-hex rule
npx astro check        # type check (keep at 0 errors)
npm run format         # prettier, conventions pinned in .prettierrc.json
node scripts/build-tokens.mjs   # regenerate src/styles/tokens.css by hand
```

Changing colour means editing `docs/theme/tokens.json` and re-running the generator — never `src/styles/tokens.css`, and never a hex literal in a component. The test suite will catch it.
