# Torchlight — status and handoff

**Last updated:** 25 August 2026
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
2. **Hollowed is warm sepia, not cold ash.** Built on the Dark Souls Remastered ramp; the ground sits a step below its darkest value, at `#100f0d`. Souls _looks_ cold, so cold blue-grey feels right and is wrong — the series is desaturated _brown_.
3. **Contrast has a ceiling as well as a floor.** `--text` targets 8–13:1, never above 14:1. Maximum-contrast text detaches and reads as glowing rather than printed. Borders sit near 1.3:1 for the same reason.
4. **Ornament reads `--ornament`, never `--torch`** — so it goes to bone when the world hollows. Asserted by test.
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
- **Google Fonts is blocked on the sandbox this branch was last built in.** `fonts.google.com/metadata/fonts` returns 403 through the egress proxy, so `unifont` resolves zero files, `fontData` comes back as empty arrays, and `npm run build` dies in the OG template with "Cannot find the font path". Nothing in the repo is wrong — it builds on a machine that can reach Google. Do not "fix" `getFontPathByWeight` in response to this error. Only the _metadata_ host is blocked; `googleapis` and `gstatic` are reachable, so the faces can be fetched by hand — see §6 for the throwaway-config workaround and its two traps.
- **A token can hold a legal value and still not do its job.** Every contrast assertion in `tests/tokens.test.ts` measures a token against `--ground`. Two of the light world's marks land on something else — the code rule sits on `--panel`, the scene line is `--scene-ink` composited at `--scene-opacity` — and both are invisible where the tests are green. **Measure a mark over the surface it actually lands on.**
- **A gold count that reads element styles misses most of the gold.** The rune bullets are `::before` backgrounds. An audit that walks `getComputedStyle(el)` and stops there reports a kindled post at 4 when it is 7.
- **…and a gold count that trusts the cascade counts marks that are not on the
  screen.** The bonfire is `opacity: 0; pointer-events: none` until the reader
  passes 120px, so at the top of a post its ash and its flame are gold in the
  cascade and absent from the page. The 20 August count of 7 included both.
  `getComputedStyle` reports the element's own opacity and tells you nothing
  about its ancestors, so the check has to **walk the parent chain for
  `opacity`, `visibility` and `display`** before it counts anything.
- **One viewport is not the page.** The same audit measured only the gate, and
  the gate is the cheapest viewport a post has — the header is not sticky, so
  scrolling _spends_ the sigil and the sun and _buys_ the bonfire and every
  bullet that comes into view. Measure at rest and scrolled; the worst case is
  wherever the repeating ornament lives, and on a kindled post that is 10, not 7.
- **`npx astro build` skips `build:tokens`.** Only `npm run build` chains them. Edit `tokens.json`, rebuild with `astro build` alone, and you screenshot the previous palette while believing you changed it — twenty minutes of "the change did nothing".

---

## 6. The kindled pass — 20 August 2026

Someone finally _looked_ at the light world: every page type, both worlds, 1440
and 390, plus hover, focus and selection states, with contrast sampled from the
rendered page rather than read off `tokens.json`. **Nothing was changed.** All
three findings turned out to be decisions rather than repairs, and they are now
§8 items 1–3.

What the pass is worth keeping for is the method and the numbers.

**Count gold from the rendered DOM, not by eye.** Walk every element in the
viewport, resolve `--torch` to `rgb()`, and match `color` / `background` /
`fill` / `stroke` / `border` **and `::before` / `::after`** against it — the
rune bullets are pseudo-element backgrounds and are invisible to any check that
only reads element styles. Then **collapse descendants**: a mark drawn with the
nib is a dozen `<path>` elements and is _one_ occurrence, not twelve. Without
that collapse the same audit reports hollowed's home page at 5 gold and tells
you nothing. With it: hollowed 1–2 everywhere, kindled 2 everywhere except a
post at 7.

**Measure a world against its own ground, and compare the two worlds by ratio,
never by hex.** Kindled's `--scene-ink` is _lighter_ than hollowed's and the
drawing is _weaker_, because one is drawn on white and the other on near-black.
The pair of hex values looks reasonable and says nothing. The composite line's
contrast against its own ground is the only number that means anything, and it
is 1.50:1 against 2.51:1.

**The light world's failures are all failures of the same kind: a mark that
exists in hollowed does not exist in kindled.** The scene, the code block's
left rule, and — inverted — a gold that hollowed spends once and kindled spends
seven times. None of it is visible to `npm test`, which is exactly what the
old §7 roadmap warned. The test suite checks that tokens have legal _values_; nothing checks
that a token does its _job_ once composited over the surface it actually lands
on. Both misses here are composite failures: `--border` over `--panel`, and
`--scene-ink` at `--scene-opacity` over `--ground`.

**A doc that contradicts itself reads as settled from either end.** §3 and §4
of `design.md` have disagreed about kindled bullets since the ornament channel
was written; each section is internally convincing, and the conflict is only
visible if you render a bulleted post in the light world and count. Two rules
that never meet on the same page are not caught by reading.

---

## 6b. The gold recount — 25 August 2026

§7's top item was picked up, and it is still the author's to decide, so
**nothing in the theme changed**. What this pass did was build all three of
`design.md` §15's options, render them, and count from the page instead of
from the cascade. Both halves of that changed the answer.

**The 20 August figure of 7 was wrong in both directions, and the real number
is worse.** Two of the seven — the bonfire's ash and its flame — are not
painted at the top of a post (§5). And the gate is the cheapest viewport the
page has. Measured on `/posts/aws-resource-hierarchy/`, kindled, counting only
what is actually on the screen:

| Option                                                   | At the gate | Scrolled into the list | Hollowed |
| -------------------------------------------------------- | ----------- | ---------------------- | -------- |
| **1** — leave it (what `main` ships today)               | 5           | **10**                 | 1        |
| **2** — kindled `--ornament` → `--text-4`                | 2           | 1                      | 1        |
| **3** — bullets read `--text-4`, ornament stays gilded   | 2           | 2                      | 1        |
| **4** — option 2, plus the sun reading the HUD's own ink | 1           | 1                      | 1        |

At 390 the same order holds (8 / 1 / 2 / 1 scrolled). Add **one** to any cell
where the cursor is on a prose link — that is the slot §4 reserves for it.

**This retires §15's claim that option 2 is the only one that satisfies the
count.** That claim came from the gate-only numbers, where option 3's residue
was the unpainted bonfire. Once the count is honest, options 2 and 3 both clear
the ceiling of three with room to spare, and the choice between them is no
longer arithmetic — it is whether the gilded ornament channel is an idea worth
keeping.

**And it is worth less than it looks.** Under option 3 the channel stays
gilded, but the only mark left reading it in a kindled viewport is the
bonfire's ash. `.rune-list` — the other rule `design.md` §3 quotes — **is
applied to nothing**: it is defined in `ornament.css`, ships in the CSS, and no
markup in `src/` carries the class. The live bullet rule is the prose one in
`typography.css` alone, so option 3 is a one-line change and option 2 spends an
idea that currently buys exactly one mark.

**Two things only the screenshots say.** The gold ash is the bonfire's own
worst enemy: at delivered size the flame and the mound beneath it merge into
one gold blob, and knocking the ash to bone is what makes the flame read as a
flame standing on ash — option 2 improves that mark rather than costing it. Set
against that, the neutral sun of option 4 **stops reading as a control**: at
`--text-4` it sits at exactly the weight of the word "About" beside it and
becomes a fifth nav item, which is the case `design.md` §8 was making when it
gave the sun the one control-gold in the theme. Option 4 buys parity with
hollowed and pays for it in the header.

**On the evidence here the recommendation is option 2, and the decision is
still the author's** — §15 is where it lives and this pass did not move it.

### Sandbox note for the next session

`npm run build` cannot complete on this runner: `fonts.google.com/metadata/fonts`
returns 403 through the egress proxy (§5), so `unifont` resolves nothing and the
OG template throws. **`fonts.googleapis.com` and `fonts.gstatic.com` are _not_
blocked** — only the metadata host is. So the way to get a real build for
screenshots is to fetch the woff2/ttf by hand from `gstatic` and point a
throwaway config at `fontProviders.local()`; never edit `astro.config.ts` for
this and never "fix" `getFontPathByWeight` in response to the error.

Two traps in that workaround, both of which cost a round here:

- **`astro build` does not regenerate `tokens.css`.** `npm run build` runs
  `build:tokens` first; `npx astro build` does not. Editing `tokens.json` and
  rebuilding with `astro build` alone silently screenshots the _old_ palette.
- **Google serves the format your User-Agent admits to supporting, and the
  obvious "very old browser" UA gets you EOT, not TrueType.** `satori` needs a
  real `.ttf` (`getFontPathByWeight` asks for `format: "truetype"`), and an
  MSIE 6 UA on `css2` returns a `/l/font?kit=…` URL whose payload begins
  `b2 e5 05 00` — an EOT header whose first word is the file's own length. It
  downloads fine, it is the right size, and the build dies on "Unsupported
  OpenType signature". A TTF starts `00 01 00 00`; **check the first four bytes
  before believing the extension you gave the file.** The UA that actually
  yields `.ttf` URLs is an old mobile WebKit — Android 2.3 / `AppleWebKit/533.1`
  — and modern Chrome yields the woff2, which `satori` cannot read either. Fetch
  both, list them as `src: [woff2, ttf]` per variant, and the browser takes the
  first while the OG generator takes the second.
- Astro v6's local provider takes `provider: fontProviders.local()` with the
  variants under `options: { variants: [...] }` — a bare `provider: "local"`
  or a top-level `variants` key fails config validation.

---

## 7. Also fixed along the way

- `editPost.url` pointed at `satnaing/astro-paper` — every "edit this post" link sent readers to someone else's repository.
- `i18n/types.ts` was missing `list`, which `en.ts` defined and `Breadcrumb` used.
- The List page lost its nav entry during the header rebuild; restored.
- `list.astro` referenced three removed custom properties and carried a four-colour category palette.
- The repo had no prettier config, so `npm run format` reformatted untouched files. Conventions pinned in `.prettierrc.json`; `tokens.css` is in `.prettierignore` because the generator owns it.

---

## 8. Roadmap

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
  numbers read smaller.
- **The hall is 60rem**, and the atmosphere's geometry now tracks the column
  rather than the viewport.
- **The world flip is instant** — the veil is gone.
- **Three marks**: a carved sigil for the site, a sun and moon for the world
  control, a rune for the edit link.
- **Two scenes**: **Approach** on the home page and **Clerestory** behind the
  four listing pages, both generated pen drawings. Clerestory is built in
  one-point perspective, which is what makes that much architecture affordable.
- **The four marks are drawn, not stroked.** `src/utils/nib.ts` takes a spine
  and a pressure profile and returns the outline a nib would have left, so the
  sigil, world control, edit rune and bonfire are filled shapes with varying
  width rather than uniform strokes. Geometric exactness was what read as cheap
  next to the scene drawings — not the shapes, the evenness of the line.
- **Breadcrumbs** replaced the back link on posts; the gate leads with the title.

### Open, in the order worth taking them

The kindled pass was done on 20 August 2026 (§6). It found three things, and
**every one of them is a decision rather than a repair** — each lands on a rule
the docs either contradict or leave open, so nothing was changed. They are the
top three items now, in the order they cost the reader:

1. **Kindled spends gold on every rune bullet, and blows the three-per-viewport
   count.** Re-measured 25 August (§6b) from what is actually painted, at rest
   and scrolled: a kindled post shows **5** gold marks at the gate and **10**
   once the reader is inside a bulleted list, against a hard ceiling of 3.
   Hollowed shows 1. `design.md` contradicts itself here — §3 makes kindled
   `--ornament` equal `--torch` (and `tests/tokens.test.ts:58` asserts it),
   while §2 invariant 2 and §4 say bullets are neutral and gold appears at most
   three times. **One of those two rules has to yield and it is not a fresh
   session's call.** All four ways out are built, screenshotted and costed in
   §6b; **option 2 is the recommendation and option 3 is now equally legal**,
   which is the part the earlier numbers got wrong. See `design.md` §15.
2. **The kindled page scenes render at 1.50:1 where hollowed renders at
   2.51:1** — the drawing is a smudge on white, not a picture. Blocked on
   `scenes.md` §5, which is still open and whose own recommendation (option 1,
   hollowed only) points the opposite way from calibrating them up.
3. **The code block's left rule does not exist in kindled** — `--border` on
   `--panel` is 1.22:1, against 1.60:1 hollowed. No value in the current token
   set fixes it: `--border` is already at the 1.3:1 §12 asks for, and the
   kindled panel is only 1.07:1 off white, so the two converge. Needs either a
   new token or a documented value moved.
4. **The remaining three scenes** — Court, Rest, Drowned. Briefs in
   `scenes.md`; Drowned is the natural next one and Rest is the hard one.
   Blocked behind item 2: settle whether kindled gets scenes before drawing
   three more.
5. **Ash variations and the stain texture.** Prototyped, undecided. The stain
   must ship un-tiled: a repeat is visible on a wide screen.
6. **The lake footer** on the 404.
7. **`eslint.config.js`** — `npm run lint` still fails, pre-existing.
8. **The post header image rule** (`design.md` §15).
9. **A real site description.** `torchlight.config.ts` duplicates the title, so
   search results and social cards read "Weibo's Home" twice.
10. **Review the `about` page prose** against the measure. Never checked.

-------------------------- | ------------------------------------------------------------------------------------------- |
| **The five page scenes** | Briefs complete in [`scenes.md`](./scenes.md); no art. Two decisions open there |
| **Ash variations** | Soot ground, ruled headings, mincho, spec block — all prototyped, none chosen |
| **The stain texture** | Must ship un-tiled: a repeat is visible on a wide screen. Dials in `stain-calibration.html` |
| **The lake footer** | Working, for the 404. Keep the ripple static — §11 permits one ambient animation |
| **Post header image rule** | `design.md` §15, still undecided |
| **`eslint.config.js`** | Pre-existing failure, unrelated to the theme |

---

## 9. Useful commands

```bash
npm run dev            # regenerates tokens, then serves on :4321
npm run build          # tokens → astro build → pagefind
npm test               # contrast floors, ornament channel, no-hex rule
npx astro check        # type check (keep at 0 errors)
npm run format         # prettier, conventions pinned in .prettierrc.json
node scripts/build-tokens.mjs   # regenerate src/styles/tokens.css by hand
```

Changing colour means editing `docs/theme/tokens.json` and re-running the generator — never `src/styles/tokens.css`, and never a hex literal in a component. The test suite will catch it.
