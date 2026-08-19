# Torchlight — Design System

A theme for a personal technical blog, built on FromSoftware's design language rather than on a palette.

**Kindled** is Anor Londo: white ground, gold leaf, lapis ultramarine, a warm shaft falling as through a clerestory window. **Hollowed** is Lordran with the fire burning low: warm sepia off the Dark Souls Remastered ramp, biscuit gold, ornament dimmed to bone. The pairing is Souls' own — the Age of Fire against the Abyss.

Torchlight is a constraint system, not a component library. Where a rule and a whim disagree, the rule wins.

**North star.** _Story through environment, not chrome. Space is the primary material. One light source, and falloff. Gold is rare relief._

- Color lives in [`tokens.json`](./tokens.json) and nowhere else.
- `scripts/build-tokens.mjs` generates `src/styles/tokens.css` from it; `tests/tokens.test.ts` enforces the rules below.

---

## 0. The direction — Ash

Three directions were prototyped rather than argued about, and a fourth and fifth added later: **A — Item Description** (the page as a Souls menu panel), **B — Ash**, **C — Illuminated** (the manuscript), **D — Datasheet** (darksouls.jp's own product page), **E — Stained Glass** (an arched header inside a shaft of light). All five are in [`prototypes/five-directions.html`](./prototypes/five-directions.html), each shown in both worlds.

**B — Ash was chosen, on 16 August 2026.**

Ash is the absence of chrome. No panels, no frames, no borders around content, no backdrop blur, no drop shadows, no corner marks. A narrow column of text in a dark room, lit from above; gold arrives only under the cursor. The atmosphere layers (§3) and the type scale (§5) carry the theme by themselves — if a device has to be drawn to make the page read as Torchlight, it is the wrong device.

The branch had previously hedged between B and A, keeping the panel recipe and the inscription while otherwise following Ash. That hedge is why it never settled. The A and C devices have been removed, not merely unused:

| Removed                                | Was                                                     |
| -------------------------------------- | ------------------------------------------------------- |
| `.panel` recipe                        | fill, border, blur, top-edge highlight, downward shadow |
| `Inscription.astro` and `.inscription` | the Souls item panel, one per post                      |
| `--blur`, `--edge`, `--shadow` tokens  | existed only to build panels                            |
| Framed code blocks                     | now one rule on the left, the same mark blockquote uses |

Anything that reintroduces a lifted surface is a regression against this section, not a new idea.

---

## 1. The four principles

Taken from how FromSoftware actually builds, not from how Souls looks in a screenshot.

**1. Story through environment, not text.** Miyazaki tells the story through the world rather than through explanation. The interface follows: almost nothing on screen explains itself. The header is an 11px corner HUD; there are no icon rows, no share buttons shaped like buttons, no decorative chips. Structure carries the meaning.

**2. Verticality.** The player is pushed up to take in scale, or down into the dark. Pages open on a tall, near-empty gate — up to 230px of nothing above the title — and section headings get up to 128px of clearance. Space is the material, not the gap between components.

**3. One light source, and falloff.** Only the path ahead is lit. A single shaft enters above the content, haze fills three depths, and the vignette drains the edges. Film grain sits over all of it, because a dark page without grain reads as clean vector art rather than as a photographed room.

**4. Gold is rare relief.** Lordran is muted brown and grey; Anor Londo's golden sunlight lands _because_ it is scarce. Gold appears three times on a page — the flame, the focus ring, and a link under the cursor. Listing titles, tags, nav items and section marks are all deliberately not gold. This is the rule most easily lost: distributing the accent turns relief into wallpaper.

---

## 2. Ten invariants

1. Grounds are warm sepia `#100f0d` (hollowed) and white `#ffffff` (kindled). Hollowed always carries the atmosphere layers of §3 — flat black reads as an empty page, not a dark room.
2. **Gold appears at most three times in a viewport.** Not a percentage — a count (§4).
3. Three hues total: gold, arcane, ember. A fourth is how a theme becomes a costume.
4. All neutrals are warm in both worlds. Hollowed is _desaturated_, which is a different axis from _cold_: the world is dying, not refrigerated.
5. Display type is engraved serif; body is a separate reading serif; mono appears only inside code.
6. Body copy sits at `--text-2`, not `--text`. You are reading in low light; `--text` is reserved for leads and emphasis.
7. Contrast has a ceiling as well as a floor: `--text` targets 8–13:1 and never exceeds 14:1 (§12).
8. Ornament reads `--ornament`, never `--torch`, so it goes out with the world.
9. **Nothing is elevated.** The theme is Ash (§0): no panels, no frames, no drop shadows, no backdrop blur. Depth is the room's light and falloff, never a surface lifted off the page.
10. Two ornament types per viewport, maximum. Space and light do the work that marks would otherwise do.

---

## 3. The two worlds

### What changes

|                 | Kindled                                  | Hollowed                                          |
| --------------- | ---------------------------------------- | ------------------------------------------------- |
| Ground          | White `#ffffff`                          | Warm sepia `#100f0d`                              |
| Ink             | `#39352a` (12.2:1)                       | Parchment `#c6bca8` (10.2:1)                      |
| Neutrals        | Warm ivory                               | Desaturated sepia                                 |
| Gold            | Gold leaf `#96631a`                      | Biscuit `#cda76b`                                 |
| Arcane register | Lapis ultramarine `#2f5296`              | Dulled teal `#659091`                             |
| `--ornament`    | **equals gold** — ornament is gilded     | **equals `--text-4`** — ornament has gone to bone |
| Light layers    | Warm shaft from above, parchment falloff | Warm glow at the centre, black falloff            |

### The arcane register changes character

This is the one token whose _meaning_ shifts between worlds rather than just its value. Hollowed, `--arcane` is frost teal — cold, dulled, magic that has gone out with everything else. Kindled, it is lapis ultramarine `#24479a`: stained glass and the ultramarine of illuminated manuscripts, the most expensive pigment a medieval scriptorium owned and the one reserved for the sacred.

The register it marks is unchanged — code, diagrams, footnotes, asides, the sideways step out of the prose. What changes is whether that step reads as dead or as divine.

### The air

The hollowed world is a hall with a fire still burning in it, not a switched-off page. Four fixed layers plus grain produce that, applied once at page level and never to a component.

```css
.air {
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(46% 42% at 50% -6%, var(--shaft), transparent 72%),
    radial-gradient(110% 52% at 50% 4%, var(--haze), transparent 70%),
    radial-gradient(140% 60% at 50% 108%, var(--haze), transparent 68%),
    radial-gradient(130% 100% at 50% 40%, transparent 32%, var(--vignette) 100%);
}

.grain {
  z-index: 0; /* behind the content — at 2 it renders every glyph through noise */
  opacity: var(--grain);
  background-image: url("data:image/svg+xml,…feTurbulence…");
}
```

`--shaft` is the single source, narrow so most of the page is not lit by it. `--haze` fills at two further depths — one under the shaft, one rising from the bottom — so the dark has volume rather than being a flat fill. `--vignette` drains the edges.

Grain is the layer people forget. At 5.5% over a dark page it is the difference between a photographed room and clean vector art. It is static; animated grain is nauseating.

Kindled runs the same layers to the opposite end: the shaft is a clerestory window at 42% warm white, the haze is parchment, and grain drops to 2.2%. Neither world gets a bespoke rule — the layers always render and the tokens decide what they mean.

**Implementation note.** `position: fixed` and `inset: 0` are applied as Tailwind utilities in the markup, not in these rules. Tailwind hoists those two declarations into `.fixed` / `.inset-0` and strips them from hand-written rules, which silently shipped the whole atmosphere unpositioned.

### The ornament channel

`--ornament` is what makes the flip a world change rather than a palette swap. Rune bullets and any structural mark read from it — never from `--torch` directly, which is the anti-pattern that would leave ornament lit in a dead world.

Kindled, `--ornament` equals gold and marks are gilded. Hollowed, it equals `--text-4` and the same marks survive in bone. Nothing moves and nothing is removed; the world has simply been abandoned. `tests/tokens.test.ts` asserts both equalities.

```css
.rune-list > li::before {
  background: var(--ornament);
}
.app-prose ul > li::before {
  background: var(--ornament);
}
```

### The transition

**Flipping worlds is instant.** No wash, no veil, no fade — the attribute changes on the click and the page is simply in the other world.

This was arrived at in three steps, and the middle one is the instructive part. The flip originally ran a full-viewport wash carrying the world's name in Display caps, `--blood` going hollow and `--torch` kindling, and held the actual swap behind a 300ms timer so the change happened unseen beneath it. That was a button that did nothing for a third of a second followed by a 1400ms loading screen. Making the swap instant and shortening the wash to 620ms fixed the lie but not the complaint: **the flip is a control, not a moment.** It is used repeatedly, and anything animated on it is something the reader has to sit through again each time.

The general rule, which is worth more than the flourish was: **a control answers immediately, and if a flourish cannot play over that answer without delaying it, the flourish loses.**

This is the theme's one permitted flourish. It is spent here because the world change is the theme's central idea; nothing else in the page gets an equivalent moment.

### Token wiring

`scripts/build-tokens.mjs` emits this shape from `tokens.json`; it is never hand-written. The complete hollowed palette lands on bare `:root`, and only token values are redefined for kindled. Never define a color inside a media query or `[data-theme]` block with no bare-`:root` counterpart — that is how a page renders one world's text on the other world's ground.

```css
:root {
  --ground: #100f0d;
  --torch: #cda76b;
  --ornament: #6d5f4c; /* …hollowed… */
}

@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]):not([data-theme="hollowed"]) {
    /* …kindled… */
  }
}
:root[data-theme="light"],
:root[data-theme="kindled"] {
  /* …kindled… */
}
```

Host stamps map onto worlds: `dark` → hollowed, `light` → kindled. The explicit world names are accepted as aliases so the site's own control can set them directly.

---

## 4. Color

Values are in [`tokens.json`](./tokens.json). This section covers how they are spent.

### The three hues

| Hue    | Token      | Means                                                                                        | Never used for                                      |
| ------ | ---------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Gold   | `--torch`  | Rare relief: the flame, an inscription heading, a link under the cursor                      | Listing titles, tags, nav, section marks, body text |
| Arcane | `--arcane` | A sideways step: code, diagrams, footnotes, inline code. Dulled teal hollowed, lapis kindled | Primary navigation, buttons                         |
| Ember  | `--blood`  | Danger, removed, deprecated, breaking                                                        | Any decorative use                                  |

Three hues is the ceiling. A fourth is how a fantasy theme becomes a costume.

### Gold appears three times

The 8% area budget an earlier draft used was too permissive: it allowed gold on every link, tag and nav item and still passed. The rule that actually holds is a count.

**Gold appears at most three times in a viewport.** On a post page that is the flame in the HUD, an inscription heading, and whatever link the cursor happens to be over. Everything else — listing titles, tags, breadcrumbs, pagination, section headings, rules, bullets — is a neutral.

Links are the sharp edge of this. They sit in `--text` with a `--text-4` underline and only turn gold on hover. A page of gold links is the failure mode: Anor Londo's sunlight lands because Lordran is brown.

### Text levels

Four levels per world. `--text-4` sits near 3.0:1 on ground and is legal for ornament and disabled controls, illegal for anything a reader must read.

---

## 5. Typography

### Faces

**One family: Cardo**, for display and for body alike. It is a Bembo descendant cut for medievalists and classicists to set old texts with all their odd glyphs — it reads as easily as any book face and carries the air of an academic edition of something much older. Good reading with a little mystery.

Display sits at **400**: Cardo at regular weight is already substantial at title size, and the theme's own rule is that space and size carry hierarchy, not weight. Bold is **700**, the only other weight the family ships — Tailwind's prose defaults `strong` to 600, which Cardo does not have, so that is overridden rather than left to synthesise.

Dropping the second family is deliberate rather than thrifty. A display face exists to contrast with a body face; this theme argues that _space_ creates hierarchy, and running two faces to say what clearance already says is the same duplication as putting a rule under a heading that has 90px above it. Mono still appears, but only inside code.

**Nothing on this site is set in capitals.** Not titles, not the HUD, not eyebrows, dates or footers. This replaced a scheme where titles were small caps and every label was uppercase at `0.14em`, and it was decided on one criterion: reading. Capitals are slower to read than lowercase because word shapes collapse to rectangles, and a blog is a thing to read rather than a thing to look at.

Two faces preceded it. **Cinzel** — the open relative of Trajan, and the closest thing to what Dark Souls uses — was replaced because it is a **capitals** face: its lowercase sprawls at display size, which is why every title had to be forced into small caps to hide it. **A workaround that load-bearing is a sign the face is wrong for the job**, not a sign the job needs a workaround. **Marcellus** replaced it briefly and reads well, but is architectural where this blog wanted something scholarly.

**Check the weights a face actually ships.** Marcellus was configured asking for 600, a weight it does not have, so the browser synthesised a fake bold for a day. The same mistake broke the build outright when the face changed: `ogTemplate.ts` looks the display font up _by weight_, and a missing weight throws. That generator now names its families by **role** rather than by typeface, so it cannot go stale the next time this changes.

Tracking came down with the capitals — `0.14em` is spacing drawn for capitals and is far too loose for lowercase, where it breaks words apart. Labels now sit near `0.06em` and are told apart from body copy by size, weight and a dimmer ink instead.

One exception, and it is deliberate: the OG social card still sets its label in capitals. A card in a timeline is glanced at, not read.

### Scale

Every step is fluid, solved for two anchors: a 375px phone and the hall's full
960px. The scale reaches its designed size exactly at full width and steps down
cleanly below it, so the min and max below are what you actually see at those
two widths.

| Role           | 375px | Full | Tracking |
| -------------- | ----- | ---- | -------- |
| Home title     | 33    | 48   | +0.03em  |
| Post title     | 34    | 50   | +0.03em  |
| Lead paragraph | 22    | 27.5 | 0        |
| Prose          | 19.5  | 25   | 0        |
| Body (chrome)  | 19    | 23   | 0        |
| H1 / H2        | 25    | 33   | +0.06em  |
| H3             | 21.5  | 26   | +0.01em  |
| H4             | 18    | 21   | +0.05em  |
| Listing title  | 23    | 27.5 | +0.03em  |
| Label / HUD    | 13    | 14.5 | +0.06em  |
| Date           | 12.5  | 12.5 | +0.1em   |
| Code           | 15    | 17.5 | 0        |

The Face column is gone because there is only one now (§5).

**Sizes are a property of the face, not of the design.** The scale went up 15%
when the family changed from Spectral to Cardo, without a single design intent
changing: Cardo's x-height is shorter, so identical numbers render visibly
smaller. Any future change of family must re-measure rather than inherit these.

It then went up a further 20%, and came back down again on reading a real page
at that size: 30px prose filled the hall edge to edge and left a post with no
air in it. The table above is the scale as it stood before that increase — the
15% Cardo correction kept, the 20% on top of it undone.

The hall did **not** come back down with it. It stays at 64rem, so the smaller
type reads as more room around the column rather than as a page that shrank in
step. At 25px a 66ch line wants about 780px and the hall offers ~944 usable, so
the ch cap is still the thing that limits the line — the inversion §9 exists to
prevent stays prevented, with margin.

**The measure never grows with the page.** Prose stays capped at 66ch, so a
wider window buys room around the text rather than longer lines — 39 characters
a line on a phone, 66 at full width. It is **left-aligned inside the hall, not
centred**: at 66ch the column is narrower than the hall, and breadcrumb, title,
date, tags and footer all hang off the hall's left edge. Centring the prose
alone stepped it in by about 40px and the page read as two competing left
margins. The centring survived unnoticed only while the measure and the hall
happened to be the same width.

Body was 16.5px for most of the build, on the theory that a little text in a
large dark space is the point. Read on a real screen it was simply hard work.
It moved as a whole rather than one step at a time, because raising body alone
flattens the hierarchy.

Section headings stay _smaller than the lead_ and dimmer than the text: a
marker you pass, not a banner. The clearance above them carries the hierarchy
instead.

Display weight is 600 only; body is 400 and 600. Faux bold is forbidden.

---

## 6. Spacing

Base unit 4px, but the numbers that matter here are the large ones. Space is the primary material (§1).

| Region               | Clearance                                                          |
| -------------------- | ------------------------------------------------------------------ |
| Home gate            | `clamp(90px, 24vh, 230px)` above, `clamp(70px, 13vh, 140px)` below |
| Post gate            | `clamp(70px, 18vh, 180px)` / `clamp(56px, 11vh, 120px)`            |
| Section gate         | `clamp(56px, 14vh, 140px)` / `clamp(44px, 8vh, 90px)`              |
| Above an H2          | `clamp(72px, 11vh, 128px)`                                         |
| Between page regions | `clamp(50px, 9vh, 110px)`                                          |

Viewport-relative units are deliberate: on a tall screen the gate should grow, because the emptiness _is_ the design.

**The proximity law.** The gap below a heading is at most half the gap above it. An H2 takes 128px above and 26px below.

**Measure.** Prose holds at 60ch; the page shell at 46rem.

---

## 7. Ornament

Ornament is scarce here. Souls tells its story through environment, so most of the work is done by space and light; marks are the exception, not the texture.

### Vocabulary

| Ornament        | Form                                                   | Means                             | Legal on                                 | Illegal on                         |
| --------------- | ------------------------------------------------------ | --------------------------------- | ---------------------------------------- | ---------------------------------- |
| **Eroded rule** | 1px line fading to transparent at both ends            | A boundary crossed                | Between page regions, footer edge        | Around content, between list items |
| **Rune bullet** | 5px square rotated 45°, `--ornament`                   | An item in a set                  | Unordered lists                          | Ordered lists, navigation          |
| **Flame**       | `◆` in `--torch`, flickering on a 5.5s cycle           | The fire, and the site's identity | The HUD, once                            | Anywhere else                      |
| **Label**       | Display 11px, `0.24em` tracking, uppercase, `--text-4` | The HUD voice                     | Metadata, eyebrows, breadcrumbs, footers | Body copy, headings                |

Rules fade at both ends because nothing in Lordran is intact. It is the one decorative liberty in the system, and it encodes decay rather than taste.

### Legality

1. **Two ornament types per viewport, maximum.**
2. **The flame appears once**, in the HUD. It is the only element on the page that moves on its own.
3. **No ornament in navigation.** Nav is wayfinding, and ornament slows scanning.
4. **Nothing reads `--torch` for a mark.** Marks take `--ornament` so they go out with the world.
5. **No mark may enclose content.** Ash draws no box: a rule separates, it never surrounds (§0).

### Excluded

Drop caps, section marks on headings, corner-bracketed frames, parchment textures, torn edges, faux-metal gradients, gemstone bullets, sword and shield glyphs, blackletter, sparkles, and `text-shadow` glows. Earlier drafts of this spec carried the first three; they were cut because with the ornament budget at two, space and light do the work better than marks do. The inscription — the Souls item panel, one per post — went with them when Ash was chosen (§0).

---

## 8. Components

**HUD** (`Header.astro`) — Display 13px at `0.14em` in `--text-4`, the soul first, nav pushed right, the world control last. No mobile menu, no logo lockup.

Three marks, and the families are deliberate. The **sigil** is the site's mark: a stem, a lozenge and a foot, cut rather than drawn, in `--torch`. It is the same vocabulary as the edit rune (below) and deliberately unlike it — centred and closed where that one is asymmetric and open, so two runes on one page cannot be confused. The **world control** is a moon when hollowed and a sun when kindled — chosen over a torch precisely because a torch is also a flame, and two gold flames in one header read as two marks rather than as a mark and a control. The moon carries the HUD's own ink, so hollowed spends no gold on the control at all.

All are drawn at 14–17px, which is the size that decides them. Two earlier versions failed on geometry rather than taste: thin wisps and a 1.25px stroke fall below the pixel grid and dissolve. A third failed on **family** — a smooth symmetrical teardrop reads as water, belongs to no other mark on the page, and is the shape an icon set would have given you.

**Edit link** (`EditPost.astro`) — a **rune**: four cut strokes, asymmetric, the mark carved beside a door to say the place is tended. It replaces the words "Edit page".

The reasoning generalises. An icon costs the reader a thing to learn, and that cost is paid for by how often they use the control — which is why the world toggle gets a sun and a moon that need no explaining, and why this one can afford to be opaque. **Almost nobody but the author clicks it**, so the goal is not discoverability but getting out of the way, and an icon that explains itself is explaining to an audience that does not need it. The words survive as the accessible name and the tooltip.

**Gate** — every page type opens with one: eyebrow label, large Display title, then metadata. Home gets up to 230px of clearance above the title, posts 180px, section pages 140px.

**Listing entry** (`Card.astro`) — Display 19px in `--text-3`, rising to `--text` on hover. Never gold. Date and description below in `--text-4`, separated by a 1px border.

**Tag** — a label with a bottom border. No chip, no fill, no gold.

**Pagination** — words at the edges, the count in the middle, spent directions dimmed to 45% rather than removed.

**Code block** — `--panel` fill and a single 1px `--border` rule on the left, the same mark blockquote carries. No frame, no blur, no shadow, no radius: a darker patch of the same room rather than a surface laid on top of it (§0).

**Prose** — 60ch measure, 16.5px at 1.85. Headings are small, wide-tracked and dim: a marker you pass, not a banner. The first paragraph steps up to `--text` at 19px.

**Adjacent post nav** — "Further In", then titles in Display, bordered rows.

**404** — an eyebrow reading "Hollowed", a huge dim numeral, one line, one link home.

**Search** — Pagefind's UI repointed at Torchlight custom properties; its primary is `--text-2`, not gold.

**Diagrams** — Mermaid built from `tokens.json → diagram`, redrawn from source on a world flip so stale SVG cannot accumulate.

### Preserved behaviour

RSS, sitemap, dynamic OG images, Pagefind search, tags, archives and pagination all survive the theme swap. OG cards render in the hollowed world — a dark card stands out in a timeline of light ones.

---

## 9. Layout

Single column, centered, inside **the hall** — `--hall`, one custom property at `64rem` (1024px) that `app-layout` and the atmosphere both read, so the content width and the room built around it cannot drift apart.

**The hall and the measure are different things, and this is the rule that matters:** the hall widened from 46rem to 60rem and then to 64rem in August 2026 — first because at 736px the page occupied under a third of a large monitor, then because the measure outgrew it. The reading measure did **not** widen with it. `.app-prose` stays capped at 66ch and sits against the hall's left edge, so a wider window buys more room around the text and never longer sentences. Gutters `clamp(22px, 6vw, 40px)`.

**The hall is borderless.** It has no edges of its own; the only thing marking where the content ends is the falloff in `.air`. Vertical hairlines at its edges were built and removed the same day — even as two rules rather than four, they gave the column a container, and Ash does not put the reader inside a box (§0). If the page feels unmoored on a wide screen the lever is the atmosphere, not an edge.

No sidebar — it competes with the measure and there is nothing to put in one.

Listing pages stack; they do not grid. A grid of cards would demand frames on every card, which §6 rule 4 forbids.

---

## 10. Depth

Ash has one z-axis device and it is the room, not the components. **Nothing in the theme casts a shadow, and nothing is lifted off the page.** The atmosphere layers of §3 — shaft, haze at three depths, vignette, grain — are the entire depth system, applied once at page level and never to a component.

```css
/* The only surface tone in the theme: recessed, not raised. */
pre {
  background: var(--panel);
  border: 0;
  border-left: 1px solid var(--border); /* the same mark blockquote uses */
}

/* Ring: focus and active states only. The one gold that is not a hover. */
outline: 1px solid var(--torch);
outline-offset: 4px;
```

**The rules that keep this from drifting back into card design:**

1. **No `box-shadow` anywhere.** A drop shadow implies a surface above the page, and in a room lit by one distant shaft nothing is close enough to the reader to cast one.
2. **No `backdrop-filter`.** Blur exists to make a panel read as floating in air; with no panels there is nothing to float.
3. **A rule separates, it never surrounds.** Left rules and bottom rules are legal. Four sides is a frame, and a frame is direction A.
4. **`--panel` is a recess, not an elevation.** It reads as a darker patch of the same ground — code and diagrams only.
5. **Depth is spacing.** Where an interface would reach for elevation to say "this is a different thing", Ash reaches for the clearance in §6 instead.

The shaft and vignette remain the one exception to "no gradients": they are the room's lighting, not a component's decoration.

---

## 11. Motion

- **One ambient animation:** the bonfire's flame on post pages, an irregular flicker. Irregular because a clean sine reads as a pulsing UI element rather than as fire. It moved here from the HUD when the site's mark became a carved sigil — **fire flickers and stone does not**, and a mark that pulses for no reason is a tic. The budget is unchanged; what spends it did.
- **No flourish.** The world flip used to be one and was removed (§3): it is a control, and controls answer instantly.
- Hover and focus: 180ms `ease-out`, colour only. Never transform, never scale.
- No scroll-triggered reveals. Content that appears only on scroll fails without JavaScript.
- Grain is static. Animated grain is nauseating.
- Everything animated sits inside `@media (prefers-reduced-motion: no-preference)`, including the flicker and the flip.

---

## 12. Accessibility

- **Contrast floors.** Body ≥ 7:1 against its ground. Secondary text and links ≥ 4.5:1. `--text-4` is ~3.0:1 and is therefore restricted to ornament and disabled states.
- **Verified pairs**, measured against each world's flat `--ground`:

  | Token                       | Hollowed | Kindled | Floor         |
  | --------------------------- | -------- | ------- | ------------- |
  | `--text`                    | 8.88:1   | 12.23:1 | 7:1           |
  | `--text-2`                  | 6.37:1   | 8.54:1  | 4.5:1         |
  | `--text-3`                  | 5.03:1   | 5.79:1  | 4.5:1         |
  | `--text-4`                  | 2.81:1   | 3.31:1  | ornament only |
  | `--torch`                   | 7.23:1   | 5.13:1  | 4.5:1         |
  | `--arcane`                  | 4.93:1   | 7.59:1  | 4.5:1         |
  | `--blood` on `--blood-tint` | 4.60:1   | 5.60:1  | 4.5:1         |

  Re-verify any token you change, in both worlds. An earlier hollowed `--blood` sat at 2.99:1 on its own tint — a danger callout nobody could read — which is the concrete reason these floors are a test rather than a note.

### Contrast has a ceiling as well as a floor

Body text is held **near 10:1 hollowed and 12:1 kindled, not at the maximum the palette allows.** An earlier revision ran bone `#f4efde` at 15.1:1 and near-black `#14130e` at 18.6:1; both were legible and both were wrong. Maximum-contrast text detaches from the page — it reads as glowing rather than as printed, and every hard edge in the layout starts to buzz.

The rule that follows: **`--text` targets 8–13:1, never above 14:1.** Borders are held deliberately low against the ground (around 1.3:1) for the same reason — a hairline at high contrast reads as harshly as glaring type. Nothing here relaxes a floor; the floors are unchanged and still met with margin.

- The hollowed glow raises effective background luminance under the content by roughly 0.01 and the vignette lowers it at the edges. Both shifts move ratios in the safe direction against a light foreground; measure against the flat `--ground` value and treat the result as the floor.
- **Never color alone.** Callouts carry a label word; diffs carry `+`/`-`. Semantic hue is reinforcement, never the sole signal.
- **Focus always visible:** 2px gold ring at 2px offset. Never `outline: none` without a replacement.
- The world control is a real `<button>` with a text label, not an icon.
- Decorative ornament glyphs are `aria-hidden`.

---

## 13. Anti-patterns

Listed so they can be caught in review. Several were committed during this theme's own construction.

| Anti-pattern                                  | Why it breaks                                                                       |
| --------------------------------------------- | ----------------------------------------------------------------------------------- |
| Gold on links, tags, nav or listing titles    | Turns relief into wallpaper; §4                                                     |
| A fourth hue                                  | Three hues is what keeps this a system rather than a costume                        |
| Cool grey anywhere                            | Souls is desaturated _brown_; cool grey reads as a rendering bug                    |
| Flat black hollowed ground                    | Reads as an empty page rather than a lit room                                       |
| Pushing `--text` to maximum contrast          | Above ~14:1 text detaches and glows instead of sitting in the page                  |
| High-contrast borders                         | A hard hairline buzzes exactly as much as glaring type                              |
| Ornament reading `--torch`                    | Leaves ornament lit in a dead world, killing the central idea                       |
| A dark page with no grain                     | Reads as clean vector art, not a photographed room                                  |
| `position: fixed` in a hand-written rule      | Tailwind hoists it into a utility and strips it — the atmosphere ships unpositioned |
| A panel, frame, card or drop shadow           | Ash lifts nothing; that is direction A, and the hedge is what stalled the theme     |
| `black` stops in an SVG `<mask>`              | SVG masks are luminance by default, so black hides — CSS `mask-image` is alpha      |
| A scene whose stone is brighter than its mist | The light is behind the castle; bright stone reads as clear weather, and flat       |
| Category colours (movie / anime / manga)      | Four decorative hues, and colour as the only signal                                 |
| Drop caps and section marks                   | Cut: with two ornaments per viewport, space and light do it better                  |
| A second ambient animation                    | §11 permits exactly one, and it is the flame                                        |
| A mark built from primitives                  | An exact circle and eight identical rays read as clip art beside a pen drawing      |
| Taper measured as a fraction of stroke length | A short stroke becomes all taper — rays turn into petals; taper over a distance     |
| A filled flame                                | Fire reads through the dark gaps between tongues, not through the gold              |
| Judging a 15px mark from its path data        | Rasterise it at delivered size over the real ground, or you are guessing            |

---

## 14. Decided and closed

**The direction is B — Ash.** See §0 for what that removed. A, C, D and E were prototyped and declined; the prototypes stay in the repository as the record of the choice, not as options still open.

**The roguelike layer stays out.** An earlier direction framed the site as a terminal dungeon crawl: mono chrome for all metadata and navigation, plus an ASCII glyph vocabulary (`>` stairs down, `#` corridor wall, `[ ]` inventory, `@` you are here). It was considered again after the Souls direction landed and declined.

The two share a root — carrying a light through a dark place — and that shared root is already expressed here: torch as the only light source, the dark world as the true state, and ornament that dims when the light goes. What the roguelike layer adds on top is the _terminal_ framing, not the _dungeon_ one. Adding it would put two costumes on one page and would spend an ornament budget (§6) that has room for one.

If it ever returns, the smallest honest version is a single glyph: `>` before "read more" and older-post links, meaning stairs down. Nothing else from that vocabulary earns its place.

---

## 15. Not yet decided

- **Illustration policy.** No rule yet for post header images; a full-bleed photo would flatten the atmosphere and needs its own treatment before one is introduced.
- **The `list` page.** Its filter buttons still use a generic pill treatment inherited from before the theme; the category colours were neutralised but the layout has not been reconsidered.
- **`about` page.** Renders through the shared gate but its prose has not been reviewed against the 60ch measure.
- **Reduced-motion grain.** Grain is static so it is safe, but it has not been tested against high-contrast or forced-colours modes.
