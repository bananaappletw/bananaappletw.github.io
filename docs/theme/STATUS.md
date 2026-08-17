# Torchlight — status and handoff

**Last updated:** 16 August 2026
**Branch:** `torchlight-theme` (20 commits ahead of `main`; `main` untouched)
**State:** implemented and working. **The direction is settled: B — Ash** (§1).

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

Everything below is on `torchlight-theme`, builds clean, and is verified:

- `npm run build` — succeeds
- `npx astro check` — 0 errors, 0 warnings
- `npm test` — 20/20 pass
- `npm run format:check` — passes
- `npm run lint` — **fails, pre-existing**: no `eslint.config.js`; ESLint 10 will not read the old v8 config. Unrelated to the theme.

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
2. **Hollowed is warm sepia, not cold ash.** Built on the Dark Souls Remastered ramp `#1b1a17 / #38322b / #695442 / #a78a6d / #f4efde`. Souls _looks_ cold, so cold blue-grey feels right and is wrong — the series is desaturated _brown_.
3. **Contrast has a ceiling as well as a floor.** `--text` targets 8–13:1, never above 14:1. Maximum-contrast text detaches and reads as glowing rather than printed. Borders sit near 1.3:1 for the same reason.
4. **Ornament reads `--ornament`, never `--torch`** — so it goes to bone when the world hollows. Asserted by test.
5. **Drop caps, section marks and carved frames were cut.** With two ornaments per viewport, space and light do the work better.
6. **The roguelike/terminal direction was considered and declined** (`design.md` §14). The escape hatch, if ever wanted, is a single `>` for "read more".
7. **Cinzel is deliberate.** Dark Souls uses Optimus Princeps, a serif on 15th-century Italian inscriptional lettering; Cinzel is the closest OFL relative. Titles are set in **small caps** because the real post titles are lowercase and Cinzel's lowercase sprawls at display size.

---

## 5. Traps found the hard way

These cost real time. All are recorded in `design.md` §13 as anti-patterns.

- **Tailwind hoists `position: fixed` and `inset: 0` into utilities and strips them from hand-written rules.** The entire atmosphere shipped unpositioned before this was caught. `.air` / `.grain` apply them as classes in `Layout.astro` instead.
- **`body > * { z-index: 1 }` is load-bearing.** `.air` and `.grain` are positioned, so they paint above any _non-positioned_ content.
- **Grain must sit behind the content.** At `z-index: 2` it rendered every glyph through noise — that is what read as "dirty".
- **Write `-webkit-backdrop-filter` before the unprefixed property**, or minification keeps only the prefixed one and panels blur in WebKit alone.
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

---

## 7. Roadmap

The plan is to **ship v1 and improve on it**, not to land everything at once.
Anything not needed to make the theme correct and coherent is deferred, on
purpose — the prototypes are committed so nothing is lost by waiting.

### Done

1. ~~Get a letter.~~ **B — Ash.**
2. ~~Strip the other directions' devices.~~ `.panel`, `Inscription.astro`, the
   `--blur` / `--edge` / `--shadow` tokens and the framed code block are gone;
   search results are no longer gold.

### v1 — what is left before merging

Only defects and unreviewed surfaces. No new devices.

3. **Give the kindled world a real pass.** It was built against the hedged
   design and has never been looked at on its own. The strip moved it along
   automatically (`--panel` is `#faf7ef` there now so code still reads against
   white), but a real post, the listings, search and the 404 have not been
   checked in the light world.
4. **Review the `about` page prose against the measure.** Never checked.
5. **Merge to `main`.** Deployment is automatic from `main` via GitHub Actions,
   so this step is the release.

### After v1

Each of these has a working prototype and a written decision behind it. None
blocks the release.

| Deferred                   | Where it stands                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| **The five page scenes**   | Briefs complete in [`scenes.md`](./scenes.md); no art. Two decisions open there             |
| **Ash variations**         | Soot ground, ruled headings, mincho, spec block — all prototyped, none chosen               |
| **The stain texture**      | Must ship un-tiled: a repeat is visible on a wide screen. Dials in `stain-calibration.html` |
| **The lake footer**        | Working, for the 404. Keep the ripple static — §11 permits one ambient animation            |
| **Post header image rule** | `design.md` §15, still undecided                                                            |
| **`eslint.config.js`**     | Pre-existing failure, unrelated to the theme                                                |

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
