import { describe, it, expect, beforeAll } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Assertions about the built site, not about the source.
 *
 * Everything here is a bug that shipped once and could not be seen from the
 * source at all — the font the browser actually fetched, the bundle a post
 * actually loaded, the URL a reader actually landed on. Each was found by
 * measuring `dist/`, so each is checked against `dist/`.
 *
 * This file needs a build, so it is excluded from `npm test` and run by
 * `npm run test:dist` after `npm run build`.
 */

const DIST = "dist";
const POST = join(DIST, "posts/opsec/index.html");

beforeAll(() => {
  if (!existsSync(POST)) {
    throw new Error(
      "dist/ is missing or stale — run `npm run build` before `npm run test:dist`",
    );
  }
});

const page = () => readFileSync(POST, "utf8");

describe("fonts", () => {
  it("links no TrueType to the browser", () => {
    // Astro emits one @font-face per format. The woff2 blocks carry a
    // unicode-range and the TrueType ones do not, so declared together under
    // the same family the TTF wins every Latin codepoint AND comes last: the
    // page was fetching 378KB of TTF and none of the 15KB woff2. TrueType is
    // for satori at build time and lives under its own --font-og variable.
    const ttf = page().match(/\/_astro\/fonts\/[a-z0-9]+\.ttf/g) ?? [];
    expect(ttf, `TrueType linked from a page: ${ttf.join(", ")}`).toEqual([]);
  });

  it("links woff2", () => {
    expect(page()).toMatch(/\/_astro\/fonts\/[a-z0-9]+\.woff2/);
  });
});

describe("diagrams", () => {
  const withDiagram = join(DIST, "posts/aws-resource-hierarchy/index.html");

  it("does not ship mermaid to a post that has none", () => {
    // Astro bundles page scripts per ROUTE, so a static `import mermaid` in a
    // component put mermaid and d3 — 257KB — into the entry every post loads.
    const srcs = page().match(/src="(\/_astro\/[^"]+\.js)"/g) ?? [];
    for (const tag of srcs) {
      const file = tag.slice(6, -1);
      const js = readFileSync(join(DIST, file), "utf8");
      expect(
        js.includes("flowchart-elk") || js.includes("mermaid version"),
        `${file} carries mermaid`,
      ).toBe(false);
    }
  });

  it("keeps the arrows in a diagram's source", () => {
    // A diagram written as raw <div class="mermaid"> has its contents read as
    // markdown text, and smartypants rewrites every `-->` into an em dash.
    // `graph LR\nA —> B` is not a graph, and all three diagrams rendered
    // mermaid's "Syntax error in text" bomb in production.
    const html = readFileSync(withDiagram, "utf8");
    expect(html).toContain('class="mermaid"');
    const block = html.slice(html.indexOf('class="mermaid"'));
    expect(block.slice(0, 400)).toContain("--&gt;");
    expect(block.slice(0, 400)).not.toContain("—");
  });
});

describe("urls", () => {
  const pairs = [
    ...readFileSync("src/redirects.ts", "utf8").matchAll(
      /"([^"]+)":\s*"([^"]+)"/g,
    ),
  ].map(m => [m[1], m[2]] as const);

  const resolves = (path: string) =>
    existsSync(join(DIST, path)) ||
    existsSync(join(DIST, path, "index.html")) ||
    existsSync(join(DIST, path.replace(/\/$/, ""), "index.html"));

  it("has redirects to check", () => {
    expect(pairs.length).toBeGreaterThan(50);
  });

  it("emits a page for every old URL", () => {
    const missing = pairs.filter(([from]) => !resolves(from));
    expect(missing.map(([f]) => f)).toEqual([]);
  });

  it("points every redirect at something that exists", () => {
    // A redirect to a 404 is not a redirect. Six tag pages failed this on the
    // first pass, because the migration collapsed those tags into `archive`.
    const dangling = pairs.filter(([, to]) => !resolves(to));
    expect(dangling.map(([f, t]) => `${f} -> ${t}`)).toEqual([]);
  });
});

describe("llms.txt", () => {
  it("lists every published post", () => {
    const txt = readFileSync(join(DIST, "llms.txt"), "utf8");
    const listed = (txt.match(/^- \[.+?\]\(https?:\/\/\S+\/posts\//gm) ?? [])
      .length;
    const built = readdirSync(join(DIST, "posts"), {
      withFileTypes: true,
    }).filter(e => e.isDirectory() && !/^\d+$/.test(e.name)).length;
    expect(listed).toBe(built);
  });
});
