# Torchlight Theme Implementation Plan

> **STATUS: implemented on branch `torchlight-theme`, 15 August 2026.**
> The plan below was written before the design was rebuilt on FromSoftware's
> design language, so it describes drop caps, section marks and carved frames
> that were deliberately cut. `docs/theme/design.md` is the current spec and
> wins wherever the two disagree. Kept for the record of what was planned and
> where the implementation diverged — see "Divergences" at the end.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace AstroPaper's presentation layer with the Torchlight theme — two worlds (hollowed/kindled), driven entirely by `docs/theme/tokens.json` — while preserving RSS, sitemap, dynamic OG images, Pagefind search, tags, archives and pagination.

**Architecture:** `docs/theme/tokens.json` is the single source of truth for color. A build script generates `src/styles/tokens.css` from it, so no component ever hardcodes a hex value. A vitest suite asserts the spec's contrast floors against that same JSON, which makes the design system's accessibility rules executable rather than aspirational. Everything else — layouts, components, ornament, typography — is rewritten against the generated custom properties. Route files, content collections and the four feature endpoints are left structurally intact and only restyled.

**Tech Stack:** Astro v6, Tailwind CSS v4 (via `@tailwindcss/postcss`), TypeScript, vitest, satori + sharp (OG), Pagefind, Shiki, Mermaid.

**Spec:** `docs/theme/design.md` and `docs/theme/tokens.json`

## Global Constraints

- Node `>=22.0.0`. Package manager: npm.
- **No hex literal may appear in any `.astro`, `.css` or `.ts` file under `src/`.** Every color comes from a custom property generated out of `docs/theme/tokens.json`. Task 1 adds a test that enforces this.
- Ornament (drop caps, section marks, carved-rule segments, frame corners) reads `var(--ornament)`, **never** `var(--torch)`. Spec §12 anti-pattern; breaking it kills the world flip.
- Gold (`--torch`) is capped at 8% of viewport area (spec §3). Post titles in listings are `--text`, not gold.
- `data-theme` accepts four values: `hollowed`, `kindled`, and the host aliases `dark`, `light`. Bare `:root` is hollowed.
- Contrast floors (spec §11): body text ≥ 7:1, secondary text and links ≥ 4.5:1, measured against the flat `--ground` of the same world. `--text-4` is exempt and restricted to ornament and disabled states.
- Fonts are self-hosted through Astro's `fonts` config with `fontProviders.google()`. No CDN link tags, no runtime font fetch.
- Motion: exactly one ambient animation (header flame flicker) and one flourish (the world flip wash). Everything animated sits inside `@media (prefers-reduced-motion: no-preference)`.
- Preserved behavior, must still work at the end: `/rss.xml`, `/sitemap-index.xml`, `/og.png`, per-post `index.png`, Pagefind search at `/search`, `/tags`, `/archives`, paginated `/posts`.
- Commit after every task. Conventional commit prefixes (`feat:`, `refactor:`, `test:`, `chore:`).

---

## File Structure

**New files**

| Path | Responsibility |
|---|---|
| `scripts/build-tokens.mjs` | Reads `docs/theme/tokens.json`, writes `src/styles/tokens.css`. The only thing allowed to emit hex into `src/`. |
| `src/styles/tokens.css` | Generated. Custom properties for both worlds. Never hand-edited. |
| `src/styles/ornament.css` | Carved rule, section mark, drop cap, carved frame, inscription. |
| `src/scripts/world.ts` | World switching, persistence, first-visit default, flip wash. Replaces `theme.ts`. |
| `src/components/WorldToggle.astro` | The kindle/hollow control. |
| `src/components/Inscription.astro` | Souls item panel: name, flavor line, plain reading. |
| `src/utils/tokens.ts` | Typed loader for `tokens.json`, used by Shiki, Mermaid and OG generation. |
| `tests/tokens.test.ts` | Contrast floors, token completeness, no-hardcoded-hex scan. |
| `torchlight.config.ts` | Renamed from `astro-paper.config.ts`. |
| `vitest.config.ts` | Test runner config. |

**Modified**

| Path | Change |
|---|---|
| `astro.config.ts` | Add Cinzel + Spectral fonts; replace Shiki themes with generated Torchlight themes. |
| `src/styles/global.css` | Import generated tokens; rewrite base layer; add glow/vignette. |
| `src/styles/theme.css` | Deleted — replaced by `tokens.css`. |
| `src/styles/typography.css` | Rewritten to the Torchlight scale. |
| `src/layouts/Layout.astro` | Font preloads, inline world-detection script, body classes. |
| `src/layouts/PostLayout.astro` | Drop cap, section marks, prose container. |
| `src/components/Header.astro`, `Footer.astro`, `Card.astro`, `Tag.astro`, `Pagination.astro`, `Datetime.astro`, `Mermaid.astro` | Restyled to tokens and ornament. |
| `src/pages/og.png.ts`, `src/pages/posts/[...slug]/index.png.ts` | Torchlight OG template. |
| `src/pages/search.astro` | Pagefind UI custom properties. |
| `src/config.ts`, `src/types/config.ts` | Renamed config import and types. |
| `package.json` | vitest, `test` script, `prebuild` token generation. |

**Deleted**

`src/assets/images/AstroPaper-v3.png`, `AstroPaper-v4.png`, `AstroPaper-v5.png`, `astropaper-og.jpg`, `forrest-gump-quote.png`, `src/styles/theme.css`, `src/scripts/theme.ts`, `astro-paper.config.ts`, `tailwind.config.ts` and `tailwind.config.js` (both unused under Tailwind v4's CSS-first config).

---

### Task 1: Token pipeline and the contrast test

Makes `tokens.json` the executable source of truth before any component depends on it.

**Files:**
- Create: `scripts/build-tokens.mjs`
- Create: `src/utils/tokens.ts`
- Create: `tests/tokens.test.ts`
- Create: `vitest.config.ts`
- Modify: `package.json`
- Generated (git-ignored is *not* wanted — commit it): `src/styles/tokens.css`

**Interfaces:**
- Consumes: `docs/theme/tokens.json` (existing).
- Produces: `src/styles/tokens.css` defining every token for both worlds; `src/utils/tokens.ts` exporting `tokens` (the parsed JSON), `type World = "hollowed" | "kindled"`, and `contrastRatio(hexA: string, hexB: string): number`.

- [ ] **Step 1: Install the test runner**

```bash
npm install --save-dev vitest
```

- [ ] **Step 2: Add vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 3: Add scripts to package.json**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"build:tokens": "node scripts/build-tokens.mjs",
"prebuild": "node scripts/build-tokens.mjs"
```

Also change `"dev"` to `"npm run build:tokens && astro dev"` so the generated file is never stale locally.

- [ ] **Step 4: Write the failing test**

Create `tests/tokens.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { tokens, contrastRatio, type World } from "../src/utils/tokens";

const WORLDS: World[] = ["hollowed", "kindled"];

describe("token completeness", () => {
  it("defines the same token names in both worlds", () => {
    const hollowed = Object.keys(tokens.hollowed).sort();
    const kindled = Object.keys(tokens.kindled).sort();
    expect(kindled).toEqual(hollowed);
  });

  it("documents a role for every token", () => {
    for (const name of Object.keys(tokens.hollowed)) {
      expect(tokens.roles[name], `missing role for ${name}`).toBeTruthy();
    }
  });
});

describe("contrast floors (spec design.md section 11)", () => {
  for (const world of WORLDS) {
    const ground = tokens[world]["--ground"];

    it(`${world}: --text is at least 7:1 on --ground`, () => {
      expect(contrastRatio(tokens[world]["--text"], ground)).toBeGreaterThanOrEqual(7);
    });

    it(`${world}: --text-2 is at least 4.5:1 on --ground`, () => {
      expect(contrastRatio(tokens[world]["--text-2"], ground)).toBeGreaterThanOrEqual(4.5);
    });

    it(`${world}: --text-3 is at least 4.5:1 on --ground`, () => {
      expect(contrastRatio(tokens[world]["--text-3"], ground)).toBeGreaterThanOrEqual(4.5);
    });

    it(`${world}: --torch is at least 4.5:1 on --ground`, () => {
      expect(contrastRatio(tokens[world]["--torch"], ground)).toBeGreaterThanOrEqual(4.5);
    });

    it(`${world}: --arcane is at least 4.5:1 on --ground`, () => {
      expect(contrastRatio(tokens[world]["--arcane"], ground)).toBeGreaterThanOrEqual(4.5);
    });

    it(`${world}: --blood is at least 4.5:1 on --blood-tint`, () => {
      expect(
        contrastRatio(tokens[world]["--blood"], tokens[world]["--blood-tint"])
      ).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe("generated stylesheet", () => {
  it("is up to date with tokens.json", () => {
    const before = readFileSync("src/styles/tokens.css", "utf8");
    execSync("node scripts/build-tokens.mjs");
    const after = readFileSync("src/styles/tokens.css", "utf8");
    expect(after).toBe(before);
  });
});

describe("no hardcoded color", () => {
  it("finds no hex literal in src, outside the generated stylesheet", () => {
    const hits = execSync(
      "grep -rInE '#[0-9a-fA-F]{3,8}\\\\b' src --include=*.astro --include=*.css --include=*.ts " +
        "| grep -v 'src/styles/tokens.css' || true"
    )
      .toString()
      .trim();
    expect(hits, `hardcoded colors:\n${hits}`).toBe("");
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/utils/tokens'`.

- [ ] **Step 6: Write the token loader**

Create `src/utils/tokens.ts`:

```ts
import raw from "../../docs/theme/tokens.json";

export type World = "hollowed" | "kindled";

type Palette = Record<string, string>;

type Tokens = {
  name: string;
  version: string;
  hollowed: Palette;
  kindled: Palette;
  roles: Record<string, string>;
  syntax: Record<World, Record<string, string>> & { _comment?: string };
  diagram: Record<World, Record<string, string>> & { _comment?: string };
};

const stripComments = (o: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(o).filter(([k]) => !k.startsWith("_")));

export const tokens = {
  ...raw,
  hollowed: stripComments(raw.hollowed) as Palette,
  kindled: stripComments(raw.kindled) as Palette,
} as unknown as Tokens;

/** sRGB relative luminance, WCAG 2.1 formula. Non-hex values return NaN. */
export function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return Number.NaN;
  const int = parseInt(m[1], 16);
  const channels = [(int >> 16) & 255, (int >> 8) & 255, int & 255];
  const [r, g, b] = channels.map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
```

- [ ] **Step 7: Write the generator**

Create `scripts/build-tokens.mjs`:

```js
import { readFileSync, writeFileSync } from "node:fs";

const tokens = JSON.parse(readFileSync("docs/theme/tokens.json", "utf8"));

const palette = world =>
  Object.entries(tokens[world])
    .filter(([name]) => !name.startsWith("_"))
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");

const syntax = world =>
  Object.entries(tokens.syntax[world])
    .filter(([name]) => !name.startsWith("_"))
    .map(([name, value]) => `  --syn-${name}: ${value};`)
    .join("\n");

const block = world => `${palette(world)}\n${syntax(world)}`;

const css = `/* GENERATED by scripts/build-tokens.mjs from docs/theme/tokens.json.
   Do not edit by hand — edit the JSON and re-run \`npm run build:tokens\`.
   Torchlight ${tokens.version}. Bare :root is the hollowed world. */

:root {
${block("hollowed")}
}

@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]):not([data-theme="hollowed"]) {
${block("kindled")
  .split("\n")
  .map(l => `  ${l}`)
  .join("\n")}
  }
}

:root[data-theme="light"],
:root[data-theme="kindled"] {
${block("kindled")}
}
`;

writeFileSync("src/styles/tokens.css", css);
console.log(`tokens.css written (${tokens.name} ${tokens.version})`);
```

- [ ] **Step 8: Generate and run the tests**

Run: `npm run build:tokens && npm test`
Expected: PASS. If the "no hardcoded color" test fails, it is reporting pre-existing hex in `src/styles/theme.css` and components — those files are removed or rewritten in Tasks 3–9. Mark that single test `it.skip` with the comment `// unskip in Task 14 once AstroPaper styles are gone` and unskip it there.

- [ ] **Step 9: Commit**

```bash
git add scripts/build-tokens.mjs src/utils/tokens.ts src/styles/tokens.css tests/tokens.test.ts vitest.config.ts package.json package-lock.json
git commit -m "feat: generate Torchlight tokens from spec and test contrast floors"
```

---

### Task 2: Fonts

**Files:**
- Modify: `astro.config.ts`
- Modify: `src/layouts/Layout.astro:44-48`

**Interfaces:**
- Produces: CSS variables `--font-display` (Cinzel 600) and `--font-body` (Spectral 400/600 + italic 400), alongside the existing `--font-google-sans-code` which stays for code.

- [ ] **Step 1: Add the faces to astro.config.ts**

In `astro.config.ts`, replace the `fonts:` array with:

```ts
  fonts: [
    {
      name: "Cinzel",
      cssVariable: "--font-display",
      provider: fontProviders.google(),
      fallbacks: ["Optima", "Palatino", "serif"],
      weights: [600],
      styles: ["normal"],
      formats: ["woff2", "ttf"],
    },
    {
      name: "Spectral",
      cssVariable: "--font-body",
      provider: fontProviders.google(),
      fallbacks: ["Charter", "Georgia", "serif"],
      weights: [400, 600],
      styles: ["normal", "italic"],
      formats: ["woff2", "ttf"],
    },
    {
      name: "Google Sans Code",
      cssVariable: "--font-google-sans-code",
      provider: fontProviders.google(),
      fallbacks: ["monospace"],
      weights: [400],
      styles: ["normal"],
      formats: ["woff2", "ttf"],
    },
  ],
```

`ttf` is retained on every face because `src/pages/og.png.ts` loads TrueType for satori (see `getFontPathByWeight`, whose default format is `truetype`).

- [ ] **Step 2: Preload in the layout**

In `src/layouts/Layout.astro`, replace the single `<Font>` tag with:

```astro
    <Font
      cssVariable="--font-display"
      preload={[{ subset: "latin", weight: 600, style: "normal" }]}
    />
    <Font
      cssVariable="--font-body"
      preload={[{ subset: "latin", weight: 400, style: "normal" }]}
    />
    <Font cssVariable="--font-google-sans-code" />
```

- [ ] **Step 3: Verify the fonts resolve**

Run: `npm run dev`, open `http://localhost:3000`, and in devtools confirm `getComputedStyle(document.body).fontFamily` contains `Spectral`, and that no request goes to `fonts.googleapis.com` at runtime.

- [ ] **Step 4: Commit**

```bash
git add astro.config.ts src/layouts/Layout.astro
git commit -m "feat: self-host Cinzel and Spectral for the Torchlight theme"
```

---

### Task 3: Base layer, glow and vignette

**Files:**
- Modify: `src/styles/global.css`
- Delete: `src/styles/theme.css`

- [ ] **Step 1: Rewrite global.css**

Replace the whole file with:

```css
@import "tailwindcss";
@import "./tokens.css";
@import "./typography.css";
@import "./ornament.css";

@theme inline {
  --color-ground: var(--ground);
  --color-surface: var(--surface);
  --color-surface-lift: var(--surface-lift);
  --color-border: var(--border);
  --color-border-soft: var(--border-soft);
  --color-text: var(--text);
  --color-text-2: var(--text-2);
  --color-text-3: var(--text-3);
  --color-text-4: var(--text-4);
  --color-torch: var(--torch);
  --color-arcane: var(--arcane);
  --color-blood: var(--blood);
  --font-display: var(--font-display);
  --font-body: var(--font-body);
  --font-mono: var(--font-google-sans-code);
}

@custom-variant hollowed (&:where([data-theme=hollowed], [data-theme=dark], [data-theme=hollowed] *, [data-theme=dark] *));

@layer base {
  html {
    background: var(--ground);
  }

  body {
    background: var(--ground);
    color: var(--text);
    font-family: var(--font-body);
    font-size: 18px;
    line-height: 1.7;
  }

  /* The fire in the hall (design.md section 2). Both layers are
     transparent when kindled, so a white page stays a white page. */
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background:
      radial-gradient(100% 62% at 50% -4%, var(--glow), transparent 62%),
      radial-gradient(128% 96% at 50% 42%, transparent 38%, var(--vignette) 100%);
  }

  body > * {
    position: relative;
    z-index: 1;
  }

  ::selection {
    background: var(--torch-tint);
    color: var(--torch);
  }

  :focus-visible {
    outline: 2px solid var(--torch);
    outline-offset: 2px;
  }

  button:not(:disabled),
  [role="button"]:not(:disabled) {
    cursor: pointer;
  }

  :target {
    scroll-margin-block: 1rem;
  }
}

@utility app-layout {
  @apply mx-auto w-full max-w-[60rem] px-5 sm:px-8 lg:px-12;
}

@utility measure {
  max-width: 68ch;
}
```

- [ ] **Step 2: Delete the old theme file**

```bash
git rm src/styles/theme.css
```

- [ ] **Step 3: Create an empty ornament stylesheet so the import resolves**

Create `src/styles/ornament.css` containing only:

```css
/* Torchlight ornament primitives. Populated in Task 6. */
```

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: build succeeds. Pages will look unstyled in places — components are restyled in Tasks 6–9.

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css src/styles/ornament.css
git rm --cached src/styles/theme.css 2>/dev/null || true
git commit -m "refactor: replace AstroPaper base layer with Torchlight ground, glow and vignette"
```

---

### Task 4: Typography scale

**Files:**
- Modify: `src/styles/typography.css` (full rewrite, currently 115 lines)

- [ ] **Step 1: Rewrite typography.css**

Replace the whole file with the scale from spec §4:

```css
@plugin "@tailwindcss/typography";

@layer base {
  .app-prose {
    @apply prose max-w-none;

    --tw-prose-body: var(--text-2);
    --tw-prose-headings: var(--text);
    --tw-prose-links: var(--torch);
    --tw-prose-bold: var(--text);
    --tw-prose-counters: var(--text-3);
    --tw-prose-bullets: var(--text-4);
    --tw-prose-hr: var(--border);
    --tw-prose-quotes: var(--text-2);
    --tw-prose-code: var(--arcane);
    --tw-prose-th-borders: var(--border);
    --tw-prose-td-borders: var(--border-soft);

    font-family: var(--font-body);
    font-size: 18px;
    line-height: 1.7;

    h1 {
      font-family: var(--font-display);
      font-weight: 600;
      font-size: clamp(34px, 6vw, 46px);
      line-height: 1.08;
      letter-spacing: 0.02em;
      text-wrap: balance;
    }

    /* proximity law: gap below a heading is at most half the gap above */
    h2 {
      font-family: var(--font-display);
      font-weight: 600;
      font-size: 27px;
      font-variant-caps: small-caps;
      letter-spacing: 0.06em;
      line-height: 1.2;
      margin-block: 48px 16px;
    }

    h3 {
      font-family: var(--font-body);
      font-weight: 600;
      font-size: 20px;
      font-style: normal;
      line-height: 1.3;
      margin-block: 34px 10px;
    }

    h4 {
      font-family: var(--font-body);
      font-weight: 600;
      font-size: 17px;
      font-variant-caps: small-caps;
      letter-spacing: 0.02em;
      margin-block: 26px 8px;
    }

    p {
      margin-block: 0 20px;
    }

    a {
      text-decoration-thickness: 1px;
      text-underline-offset: 2px;
      @apply wrap-break-word;
    }

    a:hover {
      color: var(--torch-dim);
    }

    :not(pre) > code {
      background: var(--arcane-tint);
      color: var(--arcane);
      padding: 1px 5px;
      border-radius: 2px;
      font-size: 0.85em;
      font-weight: 400;
    }

    :not(pre) > code::before,
    :not(pre) > code::after {
      content: none;
    }

    pre {
      background: var(--syn-bg);
      border: 0;
      border-radius: 2px;
      overflow-x: auto;
      font-size: 15px;
      line-height: 1.6;
    }

    blockquote {
      font-style: italic;
      border: 0;
      quotes: none;
    }

    table {
      font-size: 16px;
      font-variant-numeric: tabular-nums;
    }

    th {
      font-family: var(--font-display);
      font-weight: 600;
      font-size: 13px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-3);
      background: var(--surface);
    }

    img {
      border: 1px solid var(--border);
      margin-inline: auto;
    }

    figcaption {
      color: var(--text-3);
      font-size: 15px;
    }
  }

  .label {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 13px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-3);
    font-variant-numeric: tabular-nums;
  }

  .display {
    font-family: var(--font-display);
    font-weight: 600;
    letter-spacing: 0.02em;
    line-height: 1.1;
  }
}
```

- [ ] **Step 2: Verify a post renders**

Run: `npm run dev` and open `http://localhost:3000/posts/symbolic-exection-introduction`.
Expected: headings in Cinzel small caps, body in Spectral, inline code in teal on a teal tint.

- [ ] **Step 3: Commit**

```bash
git add src/styles/typography.css
git commit -m "refactor: apply the Torchlight type scale to prose"
```

---

### Task 5: World switching

Replaces the light/dark toggle with the two-world control, including the flip wash and the first-visit default.

**Files:**
- Create: `src/scripts/world.ts`
- Create: `src/components/WorldToggle.astro`
- Delete: `src/scripts/theme.ts`
- Modify: `src/layouts/Layout.astro` (inline script and the `<script>` import at the end of `<body>`)

**Interfaces:**
- Produces: `data-theme` on `<html>` is always one of `hollowed` | `kindled`. `localStorage` key `world`. The toggle element has `id="world-btn"` and a child `#world-label`.

- [ ] **Step 1: Replace the inline FOUC script in Layout.astro**

Swap the existing inline `<script is:inline>` block for:

```astro
    <script is:inline>
      (function () {
        // First visit lands hollowed: the dark world is the true state of
        // this site, not a night mode. A returning reader's choice wins.
        const stored = localStorage.getItem("world");
        const world =
          stored === "kindled" || stored === "hollowed" ? stored : "hollowed";
        document.firstElementChild?.setAttribute("data-theme", world);
        window.__world = { value: world };
      })();
    </script>
```

- [ ] **Step 2: Write world.ts**

Create `src/scripts/world.ts`:

```ts
const KEY = "world";
const HOLLOWED = "hollowed";
const KINDLED = "kindled";

type World = typeof HOLLOWED | typeof KINDLED;

function current(): World {
  const attr = document.firstElementChild?.getAttribute("data-theme");
  return attr === KINDLED ? KINDLED : HOLLOWED;
}

function reflect(world: World): void {
  document.firstElementChild?.setAttribute("data-theme", world);
  const label = document.querySelector("#world-label");
  if (label) label.textContent = world === KINDLED ? "Kindled" : "Hollowed";
  document
    .querySelector("#world-btn")
    ?.setAttribute("aria-label", `Current world: ${world}. Switch worlds.`);

  const bg = window.getComputedStyle(document.body).backgroundColor;
  document
    .querySelector("meta[name='theme-color']")
    ?.setAttribute("content", bg);
}

function wash(next: World, done: () => void): void {
  const veil = document.querySelector<HTMLElement>("#veil");
  const word = document.querySelector("#veil-word");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!veil || reduced) {
    done();
    return;
  }

  if (word) word.textContent = next === KINDLED ? "Kindled" : "Hollowed";
  veil.classList.remove("run");
  void veil.offsetWidth; // force reflow so the animation restarts
  veil.classList.add("run");
  window.setTimeout(done, 240);
}

function setup(): void {
  reflect(current());

  document.querySelector("#world-btn")?.addEventListener("click", () => {
    const next: World = current() === KINDLED ? HOLLOWED : KINDLED;
    wash(next, () => {
      localStorage.setItem(KEY, next);
      reflect(next);
    });
  });

  document
    .querySelector("#veil")
    ?.addEventListener("animationend", event => {
      (event.currentTarget as HTMLElement).classList.remove("run");
    });
}

setup();
document.addEventListener("astro:after-swap", setup);

document.addEventListener("astro:before-swap", event => {
  const color = document
    .querySelector("meta[name='theme-color']")
    ?.getAttribute("content");
  if (color) {
    (event as unknown as { newDocument: Document }).newDocument
      .querySelector("meta[name='theme-color']")
      ?.setAttribute("content", color);
  }
});
```

Note there is deliberately **no** `prefers-color-scheme` listener. The world is the reader's choice, not the OS's.

- [ ] **Step 3: Write the toggle and veil component**

Create `src/components/WorldToggle.astro`:

```astro
---
// The kindle/hollow control plus the flip wash it drives.
---

<button
  id="world-btn"
  type="button"
  class="label flex items-baseline gap-2 rounded-sm border px-3 py-1 hover:text-torch"
  style="border-color: var(--border);"
  aria-label="Current world: hollowed. Switch worlds."
>
  <span aria-hidden="true" style="color: var(--torch);">&#9660;</span>
  <span id="world-label">Hollowed</span>
</button>

<div id="veil" aria-hidden="true">
  <span id="veil-word">Hollowed</span>
</div>

<style>
  #veil {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    background: var(--ground);
    opacity: 0;
    pointer-events: none;
    z-index: 50;
  }

  #veil span {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: clamp(30px, 8vw, 62px);
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--torch);
    padding-left: 0.3em;
  }

  @media (prefers-reduced-motion: no-preference) {
    #veil.run {
      animation: veil 1100ms ease-in-out;
    }

    @keyframes veil {
      0% { opacity: 0; }
      22% { opacity: 1; }
      62% { opacity: 1; }
      100% { opacity: 0; }
    }
  }
</style>
```

- [ ] **Step 4: Swap the script import**

At the bottom of `src/layouts/Layout.astro`, change `import "@/scripts/theme";` to `import "@/scripts/world";`, then:

```bash
git rm src/scripts/theme.ts
```

- [ ] **Step 5: Verify**

Run: `npm run dev`. Clear `localStorage`, reload — the page must land hollowed even on a light-mode OS. Click the control: the wash runs, the world flips, and the choice survives a reload. Then set OS reduced-motion on and confirm the flip is instant with no wash.

- [ ] **Step 6: Commit**

```bash
git add src/scripts/world.ts src/components/WorldToggle.astro src/layouts/Layout.astro
git commit -m "feat: switch between the hollowed and kindled worlds"
```

---

### Task 6: Ornament primitives

**Files:**
- Modify: `src/styles/ornament.css`
- Create: `src/components/Inscription.astro`

**Interfaces:**
- Produces: classes `.carved-rule`, `.section-mark`, `.dropcap`, `.carved-frame`, `.rune-list`, `.arcane-rule`; component `Inscription` with props `{ name: string }` and a default slot plus a named `flavor` slot.

- [ ] **Step 1: Write the ornament stylesheet**

Replace `src/styles/ornament.css` with:

```css
/* Torchlight ornament (design.md section 6).
   Every mark reads --ornament, never --torch, so ornament goes to bone
   when the world is hollowed. */

@layer components {
  .carved-rule {
    position: relative;
    height: 1px;
    background: var(--border);
    border: 0;
  }

  .carved-rule::before {
    content: "";
    position: absolute;
    left: 0;
    top: -1px;
    width: 28px;
    height: 3px;
    background: var(--ornament);
  }

  .section-mark::before {
    content: "\25C6";
    color: var(--ornament);
    font-size: 0.5em;
    margin-inline-end: 0.6em;
    vertical-align: 0.35em;
  }

  .dropcap::first-letter {
    font-family: var(--font-display);
    font-weight: 600;
    color: var(--ornament);
    float: left;
    font-size: 3.6em;
    line-height: 0.84;
    padding: 6px 12px 0 0;
  }

  .carved-frame {
    position: relative;
    border: 1px solid var(--border);
    padding: 22px 26px;
  }

  .carved-frame::before,
  .carved-frame::after {
    content: "";
    position: absolute;
    width: 10px;
    height: 10px;
    border-style: solid;
    border-color: var(--ornament);
  }

  .carved-frame::before {
    top: -1px;
    left: -1px;
    border-width: 2px 0 0 2px;
  }

  .carved-frame::after {
    bottom: -1px;
    right: -1px;
    border-width: 0 2px 2px 0;
  }

  .rune-list {
    list-style: none;
    padding: 0;
  }

  .rune-list > li {
    padding-left: 24px;
    position: relative;
  }

  .rune-list > li::before {
    content: "\25C7";
    position: absolute;
    left: 0;
    color: var(--text-4);
  }

  .arcane-rule {
    border: 0;
    border-top: 1px solid var(--arcane-dim);
  }
}
```

- [ ] **Step 2: Write the Inscription component**

Create `src/components/Inscription.astro`:

```astro
---
type Props = { name: string };
const { name } = Astro.props;
---

<aside class="my-7 flex flex-col gap-2 border p-5" style="border-color: var(--border);">
  <span
    class="font-display text-[15px] font-semibold uppercase"
    style="letter-spacing: 0.18em; color: var(--torch);">{name}</span
  >
  <p class="m-0 text-[16.5px] italic" style="color: var(--text-3);">
    <slot name="flavor" />
  </p>
  <p class="m-0 text-[16.5px]" style="color: var(--text-2);"><slot /></p>
</aside>
```

- [ ] **Step 3: Verify ornament dims with the world**

Run: `npm run dev`, add `<div class="carved-rule"></div>` temporarily to `src/pages/index.astro`, and flip worlds. The gold segment must turn bone grey when hollowed. Remove the temporary markup afterwards.

- [ ] **Step 4: Commit**

```bash
git add src/styles/ornament.css src/components/Inscription.astro
git commit -m "feat: add Torchlight ornament primitives"
```

---

### Task 7: Header and footer

**Files:**
- Modify: `src/components/Header.astro`
- Modify: `src/components/Footer.astro`

- [ ] **Step 1: Restyle the header**

In `src/components/Header.astro`, keep the existing nav links, search link and routing logic. Replace the theme button with `WorldToggle`, and apply:

- Site title: `class="display text-[30px] uppercase"` with `style="letter-spacing: 0.12em;"`, preceded by `<span class="flame" aria-hidden="true">&#9670;</span>`.
- Nav links: `class="text-[15px]"` with `style="color: var(--text-3);"`; the current item gets `style="color: var(--torch); border-bottom: 2px solid var(--torch);"`.
- Remove the `active-nav` wavy-underline utility usage — it is not in the Torchlight vocabulary.
- Bottom edge: `<div class="carved-rule"></div>` after the header element.

Add the flame flicker in the component's `<style>` block:

```css
.flame {
  color: var(--torch);
  font-size: 0.6em;
}

@media (prefers-reduced-motion: no-preference) {
  .flame {
    animation: flicker 4s ease-in-out infinite;
  }

  @keyframes flicker {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.85; }
  }
}
```

- [ ] **Step 2: Restyle the footer**

In `src/components/Footer.astro`: prepend `<div class="carved-rule"></div>`, set the container to `class="app-layout flex flex-wrap justify-between gap-3 pt-5 pb-14 text-[15px]"` with `style="color: var(--text-3);"`. Keep the existing `Socials` component and copyright line.

- [ ] **Step 3: Verify**

Run: `npm run dev`. Check the flame flickers, the current nav item is gold-underlined, and the carved rule's segment dims when hollowed.

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.astro src/components/Footer.astro
git commit -m "refactor: restyle header and footer for Torchlight"
```

---

### Task 8: Listing components

**Files:**
- Modify: `src/components/Card.astro`
- Modify: `src/components/Tag.astro`
- Modify: `src/components/Pagination.astro`
- Modify: `src/components/Datetime.astro`

- [ ] **Step 1: Card — the listing entry**

Post title uses `--text`, **not** gold (spec §3, the 8% budget). Structure:

```astro
<li class="flex flex-col gap-1.5 py-5" style="border-bottom: 1px solid var(--border-soft);">
  <h3 class="display text-2xl">
    <a href={href} class="no-underline hover:text-torch" style="color: var(--text);">
      {title}
    </a>
  </h3>
  <Datetime pubDatetime={pubDatetime} modDatetime={modDatetime} />
  <p class="m-0 text-[15px]" style="color: var(--text-2);">{description}</p>
</li>
```

- [ ] **Step 2: Tag**

```astro
<a
  href={href}
  class="label rounded-sm px-2 py-0.5 no-underline"
  style="background: var(--torch-tint); color: var(--torch);"
>{name}</a>
```

Solid `--torch-tint` background, never `rgba()` (spec §12).

- [ ] **Step 3: Pagination**

Numbers in `class="display text-[15px]"`; the current page carries `style="color: var(--torch); border-bottom: 2px solid var(--torch);"`. Replace any chevron icons with the word labels "Newer posts" and "Older posts".

- [ ] **Step 4: Datetime**

Apply `class="label"` and drop the calendar icon import — the Torchlight vocabulary has no icon ornament.

- [ ] **Step 5: Verify**

Run: `npm run dev`, open `/posts`. Confirm no gold post titles in the list, tags read as solid tinted chips, and pagination uses words.

- [ ] **Step 6: Commit**

```bash
git add src/components/Card.astro src/components/Tag.astro src/components/Pagination.astro src/components/Datetime.astro
git commit -m "refactor: restyle listing components for Torchlight"
```

---

### Task 9: Post layout

**Files:**
- Modify: `src/layouts/PostLayout.astro`

- [ ] **Step 1: Apply the post structure**

- Title: `<h1 class="display" style="font-size: clamp(34px,6vw,46px); max-width: 20ch;">`
- Meta line: `class="label flex flex-wrap gap-x-4"`
- Tags row directly beneath the meta line.
- `<div class="carved-rule"></div>` between the header block and the body.
- Body wrapper: `class="app-prose measure"`.
- Drop cap: add `class="dropcap"` to the first paragraph only. In Astro this is done in a small inline script rather than in markdown, so authors don't have to mark it up:

```astro
<script>
  const first = document.querySelector(".app-prose > p");
  first?.classList.add("dropcap");
</script>
```

- Section marks: add `class="section-mark"` to `h2` elements the same way:

```astro
<script>
  document
    .querySelectorAll(".app-prose > h2")
    .forEach(h => h.classList.add("section-mark"));
</script>
```

- [ ] **Step 2: Verify the ornament budget**

Open `/posts/opsec`. Confirm exactly one drop cap on the page, and that drop cap plus section marks are the only two ornament types visible in a single viewport (spec §6 rule 1).

- [ ] **Step 3: Commit**

```bash
git add src/layouts/PostLayout.astro
git commit -m "refactor: apply Torchlight structure to the post layout"
```

---

### Task 10: Code and diagram theming

**Files:**
- Modify: `astro.config.ts` (Shiki config)
- Modify: `src/components/Mermaid.astro`

- [ ] **Step 1: Replace the Shiki themes**

In `astro.config.ts`, import the tokens and build two themes from them, replacing `themes: { light: "min-light", dark: "night-owl" }`:

```ts
import tokensJson from "./docs/theme/tokens.json";

const shikiTheme = (world: "hollowed" | "kindled") => {
  const s = tokensJson.syntax[world];
  return {
    name: `torchlight-${world}`,
    type: (world === "hollowed" ? "dark" : "light") as "dark" | "light",
    bg: s.bg,
    fg: s.plain,
    settings: [
      { scope: ["comment"], settings: { foreground: s.comment, fontStyle: "italic" } },
      { scope: ["string", "constant.other.symbol"], settings: { foreground: s.string } },
      { scope: ["constant.numeric", "constant.language"], settings: { foreground: s.constant } },
      { scope: ["keyword", "storage.type", "storage.modifier"], settings: { foreground: s.keyword } },
      { scope: ["entity.name.function", "support.function"], settings: { foreground: s.plain } },
    ],
  };
};
```

Then set:

```ts
    shikiConfig: {
      themes: {
        light: shikiTheme("kindled"),
        dark: shikiTheme("hollowed"),
      },
      defaultColor: false,
      wrap: false,
      transformers: [ /* unchanged */ ],
    },
```

`defaultColor: false` makes Shiki emit both palettes as CSS variables; the existing `dark` variant selector in `global.css` (now `hollowed`) picks between them.

- [ ] **Step 2: Theme Mermaid from the same source**

In `src/components/Mermaid.astro`, replace any hardcoded Mermaid theme config with values read from `tokens.json`:

```astro
---
import { tokens } from "@/utils/tokens";

const d = tokens.diagram;
---

<script is:inline define:vars={{ d }}>
  window.__mermaidTheme = d;
</script>
```

and in the initialization call, select `window.__mermaidTheme[document.documentElement.getAttribute("data-theme") === "kindled" ? "kindled" : "hollowed"]`, mapping `bg`, `surface`, `fg`, `line`, `accent`, `muted`, `border` onto Mermaid's `themeVariables` (`background`, `mainBkg`, `textColor`, `lineColor`, `primaryColor`, `secondaryTextColor`, `nodeBorder`). Re-initialize on `astro:after-swap` and after a world flip.

- [ ] **Step 3: Verify**

Run: `npm run build && npm run preview`. Open a post containing a fenced code block (`/posts/symbolic-exection-introduction`) and one containing a Mermaid diagram. Flip worlds and confirm both follow.

- [ ] **Step 4: Commit**

```bash
git add astro.config.ts src/components/Mermaid.astro
git commit -m "feat: derive Shiki and Mermaid themes from Torchlight tokens"
```

---

### Task 11: OG images

**Files:**
- Modify: `src/pages/og.png.ts`
- Modify: `src/pages/posts/[...slug]/index.png.ts`

- [ ] **Step 1: Rewrite the OG template**

In both files, load Cinzel 600 and Spectral 400 instead of Google Sans Code:

```ts
const displayFonts = fontData["--font-display"];
const bodyFonts = fontData["--font-body"];
const displayPath = getFontPathByWeight(displayFonts, 600);
const bodyPath = getFontPathByWeight(bodyFonts, 400);
```

and pass them to satori as:

```ts
      fonts: [
        { name: "Cinzel", data: displayData, weight: 600, style: "normal" },
        { name: "Spectral", data: bodyData, weight: 400, style: "normal" },
      ],
```

Replace the double-border card with the Torchlight treatment, reading colors from `tokens.hollowed` — social cards always render in the hollowed world, because that is the site's true state and it stands out in a timeline:

- Root `div`: `background: tokens.hollowed["--ground"]`, `padding: 72px`, `display: flex`, `flexDirection: "column"`, `justifyContent: "space-between"`.
- A 28×3px bar in `tokens.hollowed["--ornament"]` at the top — the carved rule.
- Title: `fontFamily: "Cinzel"`, `fontSize: 64`, `color: tokens.hollowed["--text"]`, `letterSpacing: "0.02em"`.
- Description: `fontFamily: "Spectral"`, `fontSize: 28`, `color: tokens.hollowed["--text-3"]`.
- Footer row: site hostname left in `tokens.hollowed["--text-4"]`, `◆` right in `tokens.hollowed["--torch"]`.

satori supports no gradients here, so the glow is omitted — the flat ground is correct for a 1200×630 card.

- [ ] **Step 2: Verify the images render**

Run: `npm run build`, then check `dist/og.png` and one post's `index.png` open as valid 1200×630 PNGs with Cinzel titles.

- [ ] **Step 3: Commit**

```bash
git add src/pages/og.png.ts "src/pages/posts/[...slug]/index.png.ts"
git commit -m "feat: render OG images in the Torchlight hollowed world"
```

---

### Task 12: Search

**Files:**
- Modify: `src/pages/search.astro`

- [ ] **Step 1: Retokenize the Pagefind UI**

Pagefind's default UI is configured through its own custom properties. Add to `src/pages/search.astro`:

```astro
<style is:global>
  #pagefind-search {
    --pagefind-ui-primary: var(--torch);
    --pagefind-ui-text: var(--text);
    --pagefind-ui-background: var(--ground);
    --pagefind-ui-border: var(--border);
    --pagefind-ui-tag: var(--surface);
    --pagefind-ui-border-width: 1px;
    --pagefind-ui-border-radius: 2px;
    --pagefind-ui-font: var(--font-body);
  }

  #pagefind-search .pagefind-ui__result-title {
    font-family: var(--font-display);
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  #pagefind-search .pagefind-ui__result-excerpt {
    color: var(--text-2);
  }
</style>
```

Confirm the wrapper element in the page carries `id="pagefind-search"`; add it if absent.

- [ ] **Step 2: Verify**

Run: `npm run build && npm run preview`, open `/search`, search for `symbolic`. The result list must use Cinzel titles and Torchlight colors in both worlds.

- [ ] **Step 3: Commit**

```bash
git add src/pages/search.astro
git commit -m "refactor: theme the Pagefind search UI with Torchlight tokens"
```

---

### Task 13: Purge AstroPaper and rename the config

**Files:**
- Rename: `astro-paper.config.ts` → `torchlight.config.ts`
- Modify: `src/config.ts`, `src/types/config.ts`, `astro.config.ts`
- Delete: AstroPaper branding images, `tailwind.config.ts`, `tailwind.config.js`
- Modify: `tests/tokens.test.ts` (unskip the hardcoded-color test)

- [ ] **Step 1: Rename the config and its types**

```bash
git mv astro-paper.config.ts torchlight.config.ts
```

In `torchlight.config.ts` rename the exported helper `defineAstroPaperConfig` → `defineTorchlightConfig`, and in `src/types/config.ts` rename `ResolvedAstroPaperConfig` → `ResolvedTorchlightConfig` and the `defineAstroPaperConfig` definition. Update the imports in `src/config.ts` and `astro.config.ts`.

While in `torchlight.config.ts`, fix a live bug: `features.editPost.url` currently points at `https://github.com/satnaing/astro-paper/edit/main/`, so every "edit this post" link sends readers to someone else's repo. Change it to `https://github.com/bananaappletw/bananaappletw.github.io/edit/main/`.

- [ ] **Step 2: Delete unused branding and config**

```bash
git rm src/assets/images/AstroPaper-v3.png src/assets/images/AstroPaper-v4.png \
       src/assets/images/AstroPaper-v5.png src/assets/images/astropaper-og.jpg \
       src/assets/images/forrest-gump-quote.png \
       tailwind.config.ts tailwind.config.js
```

Then `grep -rn "AstroPaper\|astro-paper\|astropaper" src/ *.ts *.json --include=* | grep -v node_modules` and resolve every remaining hit. `package.json`'s `"name"` becomes `"torchlight"`.

- [ ] **Step 3: Unskip the hardcoded-color test**

In `tests/tokens.test.ts`, remove the `.skip` added in Task 1 Step 8.

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: PASS, including the no-hardcoded-color scan. If it reports hits, replace those literals with `var(--token)` references.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove AstroPaper branding and rename config to Torchlight"
```

---

### Task 14: Final verification

**Files:** none modified unless a check fails.

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: exit 0, and `dist/pagefind/` present.

- [ ] **Step 2: Confirm every preserved feature still works**

Run `npm run preview`, then check each of these returns the expected content, not a 404:

```bash
curl -sSI http://localhost:4321/rss.xml       | head -1
curl -sSI http://localhost:4321/sitemap-index.xml | head -1
curl -sSI http://localhost:4321/og.png        | head -1
curl -sS  http://localhost:4321/tags          | grep -c "<a"
curl -sS  http://localhost:4321/archives      | grep -c "<a"
```

Then in a browser: `/posts` paginates, `/search` returns results, a post page renders, `/404` renders.

- [ ] **Step 3: Accessibility pass**

- Tab through the header: every link and the world control show a 2px gold focus ring.
- Set OS reduced-motion: no flame flicker, no flip wash.
- Confirm the world control is a `<button>` with a text label and an `aria-label` naming the current world.
- Run `npm test` once more for the contrast floors.

- [ ] **Step 4: Lint and format**

```bash
npm run lint && npm run format
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: verify Torchlight build, features and accessibility"
```

---

## Self-Review

**Spec coverage.** §1 invariants → Tasks 1 (contrast, no hardcoded color), 3 (ground, glow), 6 (ornament channel), 8 (solid tint tags, no gold titles). §2 two worlds → Tasks 1, 3, 5. §3 color → Task 1. §4 typography → Tasks 2, 4. §5 spacing → Task 4 (proximity law in the heading margins). §6 ornament → Task 6, applied in 7 and 9. §7 components → Tasks 6–9, 12. §8 layout → Task 3 (`app-layout`, `measure`). §9 depth → Task 3. §10 motion → Tasks 5, 7. §11 accessibility → Tasks 1, 14. §12 anti-patterns → enforced by the Task 1 tests and the Task 9 budget check. §13 closed → nothing to build.

**Gap found and closed.** The spec's 404 rule (§7) had no task; it is covered by the Task 14 browser check, since the page inherits the layout and needs no bespoke work.

**Known limitation, stated rather than hidden.** The "gold ≤ 8% of viewport" budget (§3) is not machine-checkable and is verified by eye in Tasks 9 and 14. The ornament-budget rule (§6 rule 1) is likewise a manual check.

**Type consistency.** `World` is defined once in `src/utils/tokens.ts` and reused in `scripts/build-tokens.mjs` (as plain strings), `src/scripts/world.ts` and Task 10's `shikiTheme`. `data-theme` values are `hollowed`/`kindled` everywhere, with `dark`/`light` accepted only in the CSS selectors generated by Task 1 and the `@custom-variant` in Task 3.


---

## Divergences from this plan

Recorded because the plan was written against an earlier design.

**Ornament cut.** Drop caps, `◆` section marks and corner-bracketed frames were all specified here and none shipped. With the ornament budget at two per viewport, space and light carry the hierarchy better than marks do. The eroded rule, rune bullet, flame and inscription remain.

**Gold budget replaced.** The plan carried an 8%-of-viewport rule. It was too permissive — it allowed gold on every link, tag and nav item and still passed. Replaced by a count: gold appears at most three times in a viewport.

**Routes kept, not rebuilt.** The plan already assumed this, and it held: RSS, sitemap, OG, Pagefind, tags, archives and pagination were restyled rather than reimplemented, and all still work.

**Extra work the plan did not anticipate:**

- `getFontPathByWeight` was broken. Astro emits one `FontData` entry per (weight, style, format), so `.find()` matched the woff2 entry and then failed to locate truetype inside it. OG generation could never have worked with the new fonts until this was fixed.
- Tailwind hoists `position: fixed` / `inset: 0` into utilities and strips them from hand-written rules, which shipped the entire atmosphere unpositioned. Applied as utilities in markup instead.
- `backdrop-filter` written before its `-webkit-` prefix is dropped by minification; panels blurred only in WebKit.
- `list.astro` referenced three removed custom properties and a four-colour category palette.
- `editPost.url` pointed at `satnaing/astro-paper`, so every "edit this post" link sent readers to someone else's repository.
- The repo had no prettier config, so `npm run format` reformatted untouched files. Conventions pinned in `.prettierrc.json`.

**Not done:** the `about` page prose has not been reviewed against the 60ch measure, and `npm run lint` remains broken (no `eslint.config.js` — pre-existing, unrelated to the theme).
