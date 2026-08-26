# What makes this a good website — requirements, and where it stands

`docs/theme/` covers how the site _looks_. This covers whether it is any good as
a website: what it costs to load, whether it can be read by anyone who arrives,
whether it survives being linked to in five years.

Every number below was measured on the `dist/` of 27 August 2026, not estimated.
Anything not measured says so. The TODO list at the end is ordered by what a
reader actually feels.

---

## 1. Fast — a text page should cost what text costs

**Requirements**

1. No page ships JavaScript it does not use.
2. A reader downloads one font format, not two.
3. Total transfer for a post stays under ~200KB before images.
4. Nothing blocks first paint that is not needed for first paint.

**Where it stands**

| Measure                       | Now                                             | Note                                      |
| ----------------------------- | ----------------------------------------------- | ----------------------------------------- |
| Built output                  | 14MB                                            | includes the Pagefind index and OG images |
| HTML per page                 | 41KB min / 63KB median / 162KB max              | inline critical CSS and inline SVG scenes |
| Page script entry             | **257KB**                                       | mermaid + d3, on **25 of 71** pages       |
| Posts that contain a diagram  | **3**                                           | so 22 pages pay 257KB for nothing         |
| Largest lazy chunks           | 1.4MB flowchart-elk, 529KB mindmap, 255KB katex | mermaid's own splits                      |
| Posts using maths             | **0**                                           | katex is built regardless                 |
| Font files linked from a page | 4 woff2 (12–19KB) **and 4 TTF (56–386KB)**      | see below                                 |
| Third-party asset hosts       | **none**                                        | fonts self-hosted, no analytics, no CDN   |

**The two real defects.**

`src/components/Mermaid.astro` does `import mermaid from "mermaid"` at the top
of its `<script>`. A static import is bundled into the route's shared entry, so
every post carries mermaid whether or not it draws one. The fix is a gated
dynamic import — `if (document.querySelector(".mermaid")) await import("mermaid")` —
which moves 257KB off 22 pages and costs the three diagram posts one round trip.

The fonts ship **twice**. The page declares Cardo four times in woff2 with a
`unicode-range`, and four more times in TrueType with **no** `unicode-range` —
386KB, 340KB, 252KB and 56KB. `STATUS.md` §6b describes the intended shape,
`src: [woff2, ttf]` inside one `@font-face` so the browser takes the first and
`satori` takes the second; what shipped is separate blocks, which is a different
thing. Any character outside the woff2 blocks' Latin ranges pulls a TTF. The OG
generator needs TrueType at _build_ time and nothing needs it at _read_ time.

Not measured yet: real LCP/CLS on a cold connection, and whether the inline
critical CSS is worth its 40KB floor.

---

## 2. Readable — the thing the site is for

**Requirements**

1. A measure that stays near 66 characters.
2. Contrast with a floor _and_ a ceiling, asserted rather than eyeballed.
3. One type family, sized for its own x-height.
4. Marks measured over the surface they land on.

**Where it stands.** Done, and enforced: `npm test` is 26 assertions over
`tokens.json`, including the ceiling and the no-hex rule. See `docs/theme/`.

One open consequence: at the 30px scale restored on 27 August, a 66ch line wants
~930px and the hall offers ~944, so the measure now fills the hall. Recorded in
`design.md` §5 as a known cost, not a bug.

---

## 3. Reachable — findable by people, machines and agents

**Requirements**

1. Every page: unique title, real description, canonical URL, OG image.
2. Machine-readable structure: sitemap, RSS, JSON-LD.
3. A map for agents that do not want to crawl: `/llms.txt`.
4. Full-text search that needs no server.

**Where it stands.** All present. A post carries `description`, `canonical`,
`og:*`, `application/ld+json`, an RSS `alternate` and a favicon; `/sitemap-index.xml`,
`/rss.xml`, `/llms.txt` and Pagefind search all build. No `rel="me"`, and
`twitter:` tags are on the home page but not on posts.

**The content defect underneath it.** All 25 posts have `description` identical
to `title`, so every search result, social card and `/llms.txt` line says the
same thing twice — `Card.astro` already suppresses the duplicate, and
`llms.txt.ts` omits it, but both are working around the data. Separately, 19 of
25 posts carry `pubDatetime` of 2026-06-02, the migration date rather than the
date they were written, so the archive and the feed order are fiction.

---

## 4. Usable by everyone

**Requirements**

1. Keyboard-reachable everything, with a visible focus state.
2. Landmarks and a skip link.
3. Motion respects `prefers-reduced-motion`.
4. Every image carries alt text; no image without intrinsic dimensions.

**Where it stands.** Skip link, `<main>`, `aria-label` on the controls and three
`prefers-reduced-motion` guards are all present on a post. Posts currently ship
no `<img>` at all, so rule 4 is untested rather than met — it becomes real the
moment the post header image rule (`design.md` §15) is settled.

Not measured yet: a keyboard pass over the header, search and pagination; a
screen-reader pass over the world control; forced-colours mode.

---

## 5. Durable — still working when nothing else is

**Requirements**

1. The page reads with JavaScript off.
2. No third-party runtime dependency.
3. URLs do not move; if one must, it redirects.
4. The build is reproducible from the repo alone.

**Where it stands.** No third-party hosts on any page — fonts are self-hosted,
there is no analytics and no CDN. The build is one `npm run build`.

Not measured yet: what a post looks like with JS disabled (the world control,
search and the bonfire are all scripted), and whether the Docusaurus-era URLs
still resolve after the migration.

---

## 6. Private by construction

**Requirements**

1. No analytics, no tracking pixels, no embeds that phone home.
2. No cookies the reader did not ask for.
3. Nothing loaded from a host the reader did not choose to visit.

**Where it stands.** Met, and it is the cheapest of these to keep — the only
storage is the world preference, and the only host is the origin. Worth writing
down precisely because it is the thing most likely to be given away later for a
metrics dashboard.

---

## TODO — in the order a reader feels them

1. ~~**Stop shipping mermaid to pages without diagrams.**~~ **Done, 27 August.**
   The post script entry is 257KB → **1.3KB**; mermaid is a chunk the 22
   diagram-free posts never fetch. It also turned out the three posts that
   _do_ have diagrams were rendering mermaid's syntax-error bomb in production —
   smartypants was rewriting `-->` into an em dash inside hand-written
   `<div class="mermaid">` blocks. `src/plugins/remark-mermaid.ts` now makes
   the markup from a fence, and `Mermaid.astro` — which was dead code — owns
   the behaviour.
2. ~~**Ship one font format to browsers.**~~ **Done, 27 August.** Measured,
   the browser was fetching **378KB of TTF and none of the woff2**: Astro emits
   one `@font-face` per format, the TrueType block carries no `unicode-range`
   while the woff2 blocks do, and it came last — so it won every Latin
   codepoint. TrueType now lives under its own `--font-og` variable, declared
   and never referenced, so satori still gets it at build time and no reader
   loads it. **378KB → 15KB per page**, and three of the four TTFs leave
   `dist/` entirely.
3. **Give every post a real description.** 25 of 25 duplicate the title. This is
   the highest-value content change on the list: it fixes search results, social
   cards and `/llms.txt` in one pass.
4. **Fix the migrated dates.** 19 posts claim 2026-06-02. Recover the real
   `pubDatetime` from git history or the Docusaurus front matter.
5. **Keyboard and screen-reader pass**, header through pagination, both worlds.
   Nothing here is known broken; nothing here has been checked either.
6. **Check the site with JavaScript off**, and decide what degrades and what
   must not.
7. **Confirm the old URLs still resolve** after the Docusaurus migration, and
   add redirects for any that do not.
8. **Measure LCP and CLS on a throttled connection**, once 1 and 2 are done, so
   the number means something.
9. **`twitter:` tags on posts and `rel="me"` in the head** — small, and the last
   two gaps in an otherwise complete metadata set.

Items 1, 2, 8 and 9 are mechanical. Items 3 and 4 are content work only the
author can do. Items 5, 6 and 7 are passes that need a real browser.
