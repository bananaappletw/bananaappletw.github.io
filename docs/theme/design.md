# Torchlight — Design System

A theme for a personal technical blog, built around one idea: **the site has two worlds, and the reader chooses which one they are in.**

*Kindled* is consecrated light — white ground, gold leaf, lapis ultramarine, a warm shaft falling as through a clerestory window. Cathedral and illuminated manuscript, by way of Warcraft III's painted stone. *Hollowed* is the fire burning low — warm sepia, biscuit gold, ornament dimmed to bone. That is Dark Souls: the same architecture, abandoned.

The pairing is Souls' own: the Age of Fire against the Abyss.

**On the hollowed palette.** It is built directly on the Dark Souls Remastered ramp — `#1b1a17`, `#38322b`, `#695442`, `#a78a6d`, `#f4efde` — with gold taken from the series' UI biscuit tone `#ddaf72`. That ramp is the correction to an obvious-seeming mistake: Souls looks cold, so a cold blue-grey feels right, and it is wrong. The series is desaturated *brown*. Desaturation carries the decay; the hue underneath stays warm, which is why the world reads as dying rather than as switched off.

The flip between them is not a brightness control. Both worlds are designed; neither is derived from the other.

Torchlight is a constraint system, not a component library. It fixes color, type, spacing, and ornament so any page built inside it looks like it came from one hand. Where a rule and a whim disagree, the rule wins.

**North star.** *When unsure: one gold accent held under budget, hierarchy from size and small caps rather than ornament, and the smallest ornament that still means something.*

- Color lives in [`tokens.json`](./tokens.json) and nowhere else.
- Everything below is framework-agnostic. It assumes no AstroPaper.

---

## 1. Ten invariants

1. Grounds are warm sepia `#1b1a17` (hollowed) and white `#ffffff` (kindled). Hollowed is never *flat* black — it always carries the glow and vignette layers of §2, because an unlit black page reads as empty rather than as a dark room.
2. One accent: gold. Carved when kindled, tarnished when hollowed. Capped at **8% of viewport area**; ornament gets no exemption.
3. Frost teal is a second register, not a second accent. It marks the arcane — code, diagrams, footnotes, asides — and never does a job gold already does.
4. **All neutrals are warm, in both worlds.** Hollowed runs a sepia ramp; kindled runs warm ivory. No cool grey anywhere — a cool grey against either ground reads as a rendering bug. Hollowed is *desaturated*, which is a different axis from *cold*: the world is dying, not refrigerated.
5. Display type is engraved serif in caps or small caps. Body type is a separate reading serif. Mono appears only inside code.
6. Ornament must encode something true. A rule that only decorates gets deleted.
7. Ornament budget: at most **two** ornament types visible in one viewport, never two of the same type adjacent.
8. Tag and badge backgrounds are solid hex. Never `rgba()`.
9. Depth follows the lighting. One source, above the content; shadows always fall downward, always warm, and every lifted panel catches a highlight on its top edge (§9).
10. Both worlds are designed. Neither is an inversion, a filter, or an afterthought.

---

## 2. The two worlds

### What changes

| | Kindled | Hollowed |
|---|---|---|
| Ground | White `#ffffff` | Warm sepia `#1b1a17` |
| Ink | `#39352a` (12.2:1) | Parchment `#c4b8a0` (8.9:1) |
| Neutrals | Warm ivory | Desaturated sepia |
| Gold | Gold leaf `#96631a` | Biscuit `#c9a06a` |
| Arcane register | Lapis ultramarine `#2f5296` | Dulled teal `#659091` |
| `--ornament` | **equals gold** — ornament is gilded | **equals `--text-4`** — ornament has gone to bone |
| Light layers | Warm shaft from above, parchment falloff | Warm glow at the centre, black falloff |

### The arcane register changes character

This is the one token whose *meaning* shifts between worlds rather than just its value. Hollowed, `--arcane` is frost teal — cold, dulled, magic that has gone out with everything else. Kindled, it is lapis ultramarine `#24479a`: stained glass and the ultramarine of illuminated manuscripts, the most expensive pigment a medieval scriptorium owned and the one reserved for the sacred.

The register it marks is unchanged — code, diagrams, footnotes, asides, the sideways step out of the prose. What changes is whether that step reads as dead or as divine.

### Light within the dark

The hollowed world is a hall with a fire still burning in it, not a switched-off page. Two fixed layers sit behind the content and produce that:

```css
body::before {
  content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(100% 62% at 50% -4%, var(--glow), transparent 62%),
    radial-gradient(128% 96% at 50% 42%, transparent 38%, var(--vignette) 100%);
}
```

Hollowed, `--glow` is a warm `rgba(201,162,79,0.10)` gathering above the content column and `--vignette` drains to 50% black at the borders: light collects where the reader is and falls away into the dark.

Kindled runs the same two layers to the opposite end. `--glow` is `rgba(255,233,178,0.38)` — a warm shaft entering from above, as through a clerestory window — and `--vignette` is `rgba(190,172,130,0.18)`, so the edges settle toward parchment while the centre stays pure white. Light still gathers where the reader is; here it is falling *in* rather than holding *out*.

Neither world gets a bespoke rule for this. The layers always render, and the tokens decide what they mean.

Opaque component surfaces (code blocks, table headers) sit above the glow and catch none of it, which is correct — they read as objects in the room rather than as part of the air.

### The ornament channel

`--ornament` is what makes the flip a world change rather than a palette swap. Drop caps, section marks, the gold segment on carved rules, and frame corner brackets all read from it — never from `--torch` directly.

Kindled, the ornament is gold and the page looks illuminated. Hollowed, the same marks survive in bone grey: the structure is still there, the light is not. Nothing moves, nothing is removed. The world has simply been abandoned.

```css
.dropcap::first-letter { color: var(--ornament); }
h2::before            { content: "\25C6"; color: var(--ornament); }
.rule::before         { background: var(--ornament); }
.frame::before        { border-color: var(--frame-corner); }
```

### The transition

Flipping worlds runs a full-viewport wash carrying a single word — KINDLED or HOLLOWED — in Display caps at `0.3em` tracking. The state swaps behind the wash at 240ms; the whole animation is 1100ms. Under `prefers-reduced-motion: reduce` the state swaps instantly with no wash at all.

This is the theme's one permitted flourish. It is spent here because the world change is the theme's central idea; nothing else in the page gets an equivalent moment.

### Token wiring

Define the complete hollowed palette on bare `:root`, then redefine **only** token values for kindled. Never define a color inside a media query or `[data-theme]` block with no bare-`:root` counterpart — that is how a page renders one world's text on the other world's ground.

```css
:root { --ground:#0b0c0d; --torch:#c19a4b; --ornament:#5f5e5b; /* …hollowed… */ }

@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]):not([data-theme="hollowed"]) { /* …kindled… */ }
}
:root[data-theme="light"], :root[data-theme="kindled"] { /* …kindled… */ }
```

Host stamps map onto worlds: `dark` → hollowed, `light` → kindled. The explicit world names are accepted as aliases so the site's own control can set them directly.

---

## 3. Color

Values are in [`tokens.json`](./tokens.json). This section covers how they are spent.

### The three hues

| Hue | Token | Means | Never used for |
|---|---|---|---|
| Gold | `--torch` | The reader's own path: links, current page, focus | Body text, large fills |
| Frost teal | `--arcane` | A sideways step: code, diagrams, footnotes, glossary | Primary navigation, buttons |
| Ember | `--blood` | Danger, removed, deprecated, breaking | Any decorative use |

Three hues is the ceiling. A fourth is how a fantasy theme becomes a costume.

### The 8% budget

Gold is a light source, and a light source that fills the frame stops being one. Count it: links in a paragraph, the active nav item, one section mark, one rule segment. If a viewport has a gold heading, gold links, a gold border **and** a gold badge, remove one.

The budget is why headings take gold as a *mark* rather than as their text color. Gold heading text at display size blows the budget in a single element.

### Text levels

Four levels per world. `--text-4` sits near 3.0:1 on ground and is legal for ornament and disabled controls, illegal for anything a reader must read.

---

## 4. Typography

### Faces

| Role | Stack | License |
|---|---|---|
| Display | `Cinzel, "Trajan Pro", Optima, Palatino, serif` | OFL |
| Body | `Spectral, "EB Garamond", Charter, Georgia, serif` | OFL |
| CJK | `"Noto Serif TC", "Source Han Serif TC", serif` — appended to the body stack | OFL |
| Mono | `"Google Sans Code", "JetBrains Mono", "SF Mono", ui-monospace, monospace` | — |

Cinzel is Roman inscriptional lettering — the shape of letters cut into stone, which is the theme's whole thesis. It is designed for caps; never set long strings in its lowercase.

All faces are self-hosted, subset to the ranges actually used, and inlined. No CDN, no runtime font fetch, no silent fallback.

### Scale

| Role | Size | Face | Weight | Leading | Tracking |
|---|---|---|---|---|---|
| Site title | 30 | Display | 600 | 1.10 | +0.12em, caps |
| Post title | 46 | Display | 600 | 1.08 | +0.02em |
| H2 | 27 | Display | 600 | 1.20 | +0.06em, small caps |
| H3 | 20 | Body | 600 | 1.30 | 0 |
| Body lead | 20 | Body | 400 | 1.60 | 0 |
| Body | 18 | Body | 400 | 1.70 | 0 |
| Small | 15 | Body | 400 | 1.60 | 0 |
| Meta / label | 13 | Display | 600 | 1.50 | +0.14em, caps |
| Inscription name | 15 | Display | 600 | 1.40 | +0.18em, caps |
| Code | 15 | Mono | 400 | 1.60 | 0 |

Three leading bands only — 1.08–1.20 tight, 1.30–1.40 heading, 1.60–1.70 reading. A fourth band is drift.

**Weights.** Display 600 only. Body 400 and 600. Faux bold is forbidden; if a weight is missing, load it or don't use it.

**Small caps** via `font-variant-caps`, never by uppercasing source text — screen readers announce uppercased text differently and copy-paste breaks.

**Measure.** Body copy holds at **68ch**. Wide content gets its own `overflow-x: auto` container.

**Numerals.** `font-variant-numeric: tabular-nums` on dates, tables, pagination.

---

## 5. Spacing

Base unit **4px**.

| Tier | Value | Use |
|---|---|---|
| xs | 4 | Inline adjacent elements |
| sm | 8 | Badge padding, tight stacks |
| md | 12–16 | Component interior |
| lg | 24 | Between components |
| xl | 40 | Section-title margins |
| 2xl | 64 | Between major sections |
| 3xl | 96 | Between page regions |

**The proximity law.** The gap *below* a heading must be **≤50%** of the gap above it. A heading belongs to what follows. This single rule does more for a page's rhythm than any ornament in §6.

```css
h2 { margin-block: 48px 16px; }   /* 16 ≤ 24 ✓ */
h3 { margin-block: 34px 10px; }   /* 10 ≤ 17 ✓ */
```

Lay siblings out with flex or grid and `gap`, never per-element margins that collapse or double.

---

## 6. Ornament

The part that makes it fantasy rather than a dark blog theme — and the part most likely to ruin it. Every ornament has a meaning and a legality rule. Ornament with no meaning is costume.

### Vocabulary

| Ornament | Form | Means | Legal on | Illegal on |
|---|---|---|---|---|
| **Carved rule** | 1px `--border` line, 28×3px `--ornament` segment at its left end | A boundary the reader crosses | Section breaks, header and footer edges | Inside a card, between list items |
| **Section mark** | `◆` at 0.5em in `--ornament`, before an H2 | This section opens here | H2 only | H1, H3, nav, buttons |
| **Drop cap** | First letter, Display face, 3 lines deep, `--ornament` | The tale begins | First paragraph of a post, once | Any other paragraph, listing pages |
| **Carved frame** | 1px `--border`, 10px corner brackets top-left and bottom-right | A contained artifact | Quotes, one featured item | Every card in a grid |
| **Inscription** | Panel; name in Display caps `+0.18em`, hairline, plain reading, hairline, italic flavour **last** | A thing named and described | Defining a term the post turns on | General callouts |
| **Rune bullet** | `◇` in `--text-4` | An item in a set | Unordered lists | Ordered lists, navigation |
| **Arcane rule** | 1px `--arcane-dim` hairline | You are stepping sideways | Footnote separator, aside top edge | Anything in the gold register |

### Legality rules

1. **Two types per viewport, maximum.** A drop cap plus section marks is fine. Drop cap, section marks, frames, inscriptions and rune bullets together is a theme park.
2. **Never two of the same type adjacent.** Two carved rules with only a heading between them collapse into noise.
3. **Drop cap once per page.** It marks the opening of the tale; a second means nothing.
4. **Corner brackets only where content is genuinely bounded.** Applying them to every card in a grid blows the gold budget and makes the grid unreadable.
5. **No ornament in navigation.** Nav is wayfinding. The current item takes gold text and a 2px gold underline, nothing more.
6. **The inscription is rationed to one per post.** It is the Souls item panel — it works because it is rare.

### Explicitly excluded

Parchment background images, torn-paper edges, faux-metal gradients, gemstone bullets, sword and shield glyphs, blackletter anywhere, animated sparkles, `text-shadow` glows. Each is the shortcut version of an effect this system builds properly with type and color.

---

## 7. Components

Framework-agnostic inventory, defined by what each does so it can be rebuilt in any stack.

**Site header** — Site title in Display caps at `+0.12em`, preceded by the flame mark. Nav right, current item gold with a 2px underline. World control at the far right as a text label showing the current world. Bottom edge is a carved rule.

**Post listing entry** — Title in Display 24, `--text`, *not* gold; a list of gold titles blows the budget. Date and tags on a meta line. One-line excerpt. Entries separated by `--border-soft` hairlines. Hover raises the title to gold.

**Post body** — Drop cap on the first paragraph. Body 18 at 68ch. H2 with section mark, H3 plain. Links gold, underline 1px at 2px offset.

**Tag** — Display 13 caps, gold on solid `--torch-tint`, 2px radius. Solid hex background, never `rgba()`.

**Quote** — Carved frame, italic Body 18, attribution in Display caps. The one place italic runs at length.

**Inscription** — See §6. Game order, not blog order: name, hairline, the plain reading, hairline, then the italic flavour last. Souls puts flavour text at the bottom because it is the payoff and the eye lands there. Rationed to one per post.

**Callout** — Three variants distinguished by hue **and** a leading label word, never by color alone: note (`--arcane`), warning (`--torch`), danger (`--blood`). Solid tint fill, 1px matching border, no icon.

**Code block** — `--surface` fill, no border, 2px radius, `overflow-x: auto`. Language label top-right in Display 11 caps. Syntax from `tokens.json → syntax`; five values, no more.

**Table** — Header row in Display caps on `--surface`. `--border-soft` row separators. Numeric columns right-aligned, tabular numerals. Wrapped in `overflow-x: auto` so the page never scrolls sideways.

**Diagram** — Mermaid from `tokens.json → diagram`. The accent role takes `--arcane`, not `--torch`.

**Pagination** — Numbers in Display 15, current in gold with underline. Previous/next as word labels, not chevrons.

**Footer** — Carved rule top edge. Identity left, links right, Body 15 in `--text-3`.

**404** — Display 46, one line of body copy, one link home. Read once; no illustration.

**Search** — The one component with an external dependency (Pagefind ships its own CSS). Override its custom properties onto Torchlight tokens; unstyled Pagefind chrome is a bug, not an acceptable state.

### Rebuilt if AstroPaper is dropped
RSS, sitemap, dynamic OG images, archives grouping, scheduled-post filtering, Pagefind integration. Behavior, not styling — this document does not specify them, and they will not survive the theme swap on their own.

---

## 8. Layout

Single column, centered. `max-width: 72ch` on post pages, `60rem` on listing pages, gutters `clamp(20px, 5vw, 48px)`.

No sidebar — it competes with the measure and there is nothing to put in one.

Listing pages stack; they do not grid. A grid of cards would demand frames on every card, which §6 rule 4 forbids.

---

## 9. Depth

Depth follows from the lighting, not from decoration. `--glow` (§2) establishes a single source above the content, so **every shadow in the system falls downward from that one source**, and every lifted surface catches a faint highlight on its top edge where the light lands.

```css
/* The panel recipe — Souls menus sit over the world, not on top of it */
.panel {
  background: var(--panel);              /* translucent hollowed, solid kindled */
  border: 1px solid var(--border);       /* dark outer rule */
  box-shadow:
    inset 0 1px 0 0 var(--edge),         /* light catching the top edge */
    var(--shadow);                       /* and falling downward */
}

/* Raised: for the one element on a page that sits above the rest */
box-shadow: inset 0 1px 0 0 var(--edge), var(--shadow-lift);

/* Ring: focus and active states only */
box-shadow: 0 0 0 2px var(--torch);

/* Recess: set into the page rather than on it */
background: var(--surface);              /* table headers — no border, no shadow */
```

**The rules that keep this from becoming generic card design:**

1. **One light source, one direction.** Shadows only ever fall downward. A shadow offset sideways or upward contradicts the glow and reads immediately as fake.
2. **Shadows are warm, never neutral black.** Hollowed uses `rgba(0,0,0,0.45)` against a sepia ground; kindled uses `rgba(122,102,62,·)`, a parchment shadow rather than a grey one.
3. **The top-edge highlight is not optional.** A shadow without it reads as a sticker pasted on the page. The `--edge` inset is what makes the panel look lit.
4. **Two depths only** — `--shadow` and `--shadow-lift`. A third value is drift.
5. **Only panels cast.** Rules, text, tags and list entries stay flat. If everything lifts, nothing does.

The glow and vignette remain the one exception to "no gradients": they are the room's lighting, applied once at page level, never to a component.

---

## 10. Motion

- **One flourish, spent on the world flip** (§2). Nothing else gets an equivalent moment.
- **One ambient animation:** a 4s opacity flicker between 0.85 and 1 on the header flame mark. Nothing else animates on its own.
- Hover and focus: 120ms `ease-out`, color and border only. Never transform, never scale.
- No scroll-triggered reveals. Content that appears only on scroll fails without JavaScript.
- Every animation sits inside `@media (prefers-reduced-motion: no-preference)`, including the flicker and the flip wash.

---

## 11. Accessibility

- **Contrast floors.** Body ≥ 7:1 against its ground. Secondary text and links ≥ 4.5:1. `--text-4` is ~3.0:1 and is therefore restricted to ornament and disabled states.
- **Verified pairs**, measured against each world's flat `--ground`:

  | Token | Hollowed | Kindled | Floor |
  |---|---|---|---|
  | `--text` | 8.88:1 | 12.23:1 | 7:1 |
  | `--text-2` | 6.37:1 | 8.54:1 | 4.5:1 |
  | `--text-3` | 5.03:1 | 5.79:1 | 4.5:1 |
  | `--text-4` | 2.81:1 | 3.31:1 | ornament only |
  | `--torch` | 7.23:1 | 5.13:1 | 4.5:1 |
  | `--arcane` | 4.93:1 | 7.59:1 | 4.5:1 |
  | `--blood` on `--blood-tint` | 4.60:1 | 5.60:1 | 4.5:1 |

  Re-verify any token you change, in both worlds. An earlier hollowed `--blood` sat at 2.99:1 on its own tint — a danger callout nobody could read — which is the concrete reason these floors are a test rather than a note.

### Contrast has a ceiling as well as a floor

Body text is held **near 9:1 hollowed and 12:1 kindled, not at the maximum the palette allows.** An earlier revision ran bone `#f4efde` at 15.1:1 and near-black `#14130e` at 18.6:1; both were legible and both were wrong. Maximum-contrast text detaches from the page — it reads as glowing rather than as printed, and every hard edge in the layout starts to buzz.

The rule that follows: **`--text` targets 8–13:1, never above 14:1.** Borders are held deliberately low against the ground (around 1.3:1) for the same reason — a hairline at high contrast reads as harshly as glaring type. Nothing here relaxes a floor; the floors are unchanged and still met with margin.
- The hollowed glow raises effective background luminance under the content by roughly 0.01 and the vignette lowers it at the edges. Both shifts move ratios in the safe direction against a light foreground; measure against the flat `--ground` value and treat the result as the floor.
- **Never color alone.** Callouts carry a label word; diffs carry `+`/`-`. Semantic hue is reinforcement, never the sole signal.
- **Focus always visible:** 2px gold ring at 2px offset. Never `outline: none` without a replacement.
- The world control is a real `<button>` with a text label, not an icon.
- Decorative ornament glyphs are `aria-hidden`.

---

## 12. Anti-patterns

| Anti-pattern | Why it breaks |
|---|---|
| Gold heading text at display size | Blows the 8% budget in one element; gold stops reading as a light source |
| Pushing `--text` to maximum contrast | Above ~14:1 text detaches and reads as glowing rather than printed; §11 sets a ceiling as well as a floor |
| High-contrast borders | A hard hairline buzzes exactly as much as glaring type; borders sit near 1.3:1 on the ground |
| A fourth hue | Three hues is what keeps this a system rather than a costume |
| Mixing warm and cold neutrals inside one world | The page reads as two renderers; §1 rule 4 |
| Flat black hollowed ground with no glow or vignette | Reads as an empty page rather than a lit room — the whole Souls register collapses |
| Applying the glow gradient to a component | It is the room's lighting, applied once at page level; on a card it becomes decoration |
| Deriving hollowed by inverting kindled | Produces muddy gold and a grey-blue cast; each world is designed |
| Ornament reading from `--torch` instead of `--ornament` | Ornament stays lit in the hollowed world, killing the central idea |
| `rgba()` tag backgrounds | Unpredictable over tinted grounds; use the `-tint` tokens |
| Blackletter | Illegible at body sizes, dates the design instantly |
| Ornament on every card | §6 rule 4; grids become unreadable |
| Parchment texture images | The warmth is in the tokens already; a texture adds weight and moiré |
| A second flourish animation | §10 permits exactly one, and it is the flip |
| Uppercasing source text for small caps | Breaks screen readers and copy-paste |

---

## 13. Decided and closed

**The roguelike layer stays out.** An earlier direction framed the site as a terminal dungeon crawl: mono chrome for all metadata and navigation, plus an ASCII glyph vocabulary (`>` stairs down, `#` corridor wall, `[ ]` inventory, `@` you are here). It was considered again after the Souls direction landed and declined.

The two share a root — carrying a light through a dark place — and that shared root is already expressed here: torch as the only light source, the dark world as the true state, and ornament that dims when the light goes. What the roguelike layer adds on top is the *terminal* framing, not the *dungeon* one. Adding it would put two costumes on one page and would spend an ornament budget (§6) that has room for one.

If it ever returns, the smallest honest version is a single glyph: `>` before "read more" and older-post links, meaning stairs down. Nothing else from that vocabulary earns its place.

---

## 14. Not yet decided

- Whether Torchlight ships as a reusable Astro theme package or stays private to this blog. The spec allows either.
- Illustration policy. No rule yet for post header images; a full-bleed photo would overwhelm the palette and needs its own treatment rule before one is introduced.
- Whether the world control should persist a reader's choice across visits, and whether first-time visitors land hollowed or follow their system setting.
