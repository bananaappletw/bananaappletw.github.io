# Torchlight — status and handoff

**Last updated:** 16 August 2026
**Branch:** `torchlight-theme` (20 commits ahead of `main`; `main` untouched)
**State:** implemented and working, but **a design decision is pending** — see §1.

Read this first, then [`design.md`](./design.md) for the spec and [`tokens.json`](./tokens.json) for colour.

---

## 1. The open decision — start here

The theme was built, then rebuilt on FromSoftware's design language, then iterated several times on vague feedback ("looks weird", "doesn't feel natural", "looks dirty"). That was inefficient, so the work paused and **three prototypes were made instead, for a pick:**

**Prototype page:** https://claude.ai/code/artifact/bd4b36c1-8304-4ee3-8d4c-8f5c65184ba6
**Source, committed:** [`prototypes/three-directions.html`](./prototypes/three-directions.html) — open it directly in a browser. Fonts are not inlined in the committed copy, so it falls back to Georgia; run the site's build and inline `dist/_astro/fonts/*.woff2` if you need Cinzel and Spectral exactly.

|       | Direction        | Character                                                                              | Trade-off                                                                 |
| ----- | ---------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **A** | Item Description | The page is a Souls menu panel: framed, translucent, hairline rules, flavour text last | Strongest identity; the frame costs horizontal room and can feel boxed-in |
| **B** | Ash              | No panels, no borders, no chrome. A narrow column in a dark room, lit from above       | Best for long reads; least obviously themed at a glance                   |
| **C** | Illuminated      | The manuscript: warmer ground, centred title, gold rules, drop cap, fleurons           | Closest to Anor Londo and the fairy-tale note; dates fastest if overdone  |

**What is on the branch right now is closest to B with pieces of A bolted on.** That hedge is the most likely reason it never settled. Once a letter is chosen, commit to that language and remove the other's devices.

**No answer was given before the session ended.** Do not guess — ask.

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

| File                                                          | Role                                                          |
| ------------------------------------------------------------- | ------------------------------------------------------------- |
| `src/styles/global.css`                                       | base layer, atmosphere (`.air`, `.grain`), panel recipe, veil |
| `src/styles/typography.css`                                   | prose scale; `h1` and `h2` share a rule (see §5)              |
| `src/styles/ornament.css`                                     | eroded rule, label, rune bullet, flame, inscription           |
| `src/scripts/world.ts`                                        | world switching, persistence, flip wash                       |
| `src/components/Header.astro`                                 | the HUD                                                       |
| `src/pages/posts/[...slug]/_components/BackToTopButton.astro` | the bonfire                                                   |
| `torchlight.config.ts`                                        | site config (renamed from `astro-paper.config.ts`)            |

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

---

## 6. Also fixed along the way

- `editPost.url` pointed at `satnaing/astro-paper` — every "edit this post" link sent readers to someone else's repository.
- `i18n/types.ts` was missing `list`, which `en.ts` defined and `Breadcrumb` used.
- The List page lost its nav entry during the header rebuild; restored.
- `list.astro` referenced three removed custom properties and carried a four-colour category palette.
- The repo had no prettier config, so `npm run format` reformatted untouched files. Conventions pinned in `.prettierrc.json`; `tokens.css` is in `.prettierignore` because the generator owns it.

---

## 7. Next steps, in order

1. **Get a letter (A, B or C).** Everything else depends on it.
2. Commit to that language; strip the other directions' devices so the theme stops hedging.
3. Rebuild the **kindled** world to match — it currently follows the hedged design.
4. Review the `about` page prose against the measure; it has never been checked.
5. Decide the post-header-image rule (`design.md` §15) — a full-bleed photo would flatten the atmosphere.
6. Fix `eslint.config.js` (independent of the theme).
7. Merge to `main` when settled. Deployment is automatic from `main` via GitHub Actions.

---

## 8. Useful commands

```bash
npm run dev            # regenerates tokens, then serves on :3000
npm run build          # tokens → astro build → pagefind
npm test               # contrast floors, ornament channel, no-hex rule
npx astro check        # type check (keep at 0 errors)
npm run format         # prettier, conventions pinned in .prettierrc.json
node scripts/build-tokens.mjs   # regenerate src/styles/tokens.css by hand
```

Changing colour means editing `docs/theme/tokens.json` and re-running the generator — never `src/styles/tokens.css`, and never a hex literal in a component. The test suite will catch it.
