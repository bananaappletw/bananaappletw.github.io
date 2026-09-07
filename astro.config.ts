import {
  defineConfig,
  envField,
  fontProviders,
  svgoOptimizer,
} from "astro/config";
// import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import { remarkMermaid } from "./src/plugins/remark-mermaid";
import { redirects } from "./src/redirects";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import config from "./torchlight.config";
import tokensJson from "./docs/theme/tokens.json";

/**
 * Shiki themes built from docs/theme/tokens.json so code cannot drift from
 * the rest of the palette. Three hues plus two neutrals — in a world this
 * muted, every colour has to mean something.
 */
const shikiTheme = (world: "hollowed" | "kindled") => {
  const s = tokensJson.syntax[world];
  return {
    name: `torchlight-${world}`,
    type: (world === "hollowed" ? "dark" : "light") as "dark" | "light",
    bg: s.bg,
    fg: s.plain,
    settings: [
      {
        scope: ["comment", "punctuation.definition.comment"],
        settings: { foreground: s.comment, fontStyle: "italic" },
      },
      {
        scope: ["string", "constant.other.symbol", "string.quoted"],
        settings: { foreground: s.string },
      },
      {
        scope: ["constant.numeric", "constant.language", "constant.character"],
        settings: { foreground: s.constant },
      },
      {
        scope: [
          "keyword",
          "storage.type",
          "storage.modifier",
          "keyword.control",
        ],
        settings: { foreground: s.keyword },
      },
      {
        scope: [
          "variable",
          "entity.name.function",
          "support.function",
          "entity.name.type",
        ],
        settings: { foreground: s.plain },
      },
    ],
  };
};

export default defineConfig({
  site: config.site.url,
  integrations: [
    mdx(),
    sitemap({
      filter: page =>
        config.features?.showArchives !== false || !page.endsWith("/archives/"),
    }),
  ],
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  // Every pre-Astro URL, mapped. See src/redirects.ts.
  redirects,

  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkToc,
        [remarkCollapse, { test: "Table of contents" }],
        // before Shiki, so a diagram never becomes a highlighted code block
        remarkMermaid,
      ],
    }),
    shikiConfig: {
      themes: {
        light: shikiTheme("kindled"),
        dark: shikiTheme("hollowed"),
      },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    plugins: [],
  },
  fonts: [
    {
      // Alegreya: drawn by Huerta Tipografica for long-form literature,
      // Renaissance-rooted and a little irregular by design, so it keeps the
      // air of an old book without the fragility of one. It replaced Cardo
      // on 8 September 2026 for a measured reason, recorded in design.md
      // section 5: Cardo's stroke contrast is 2.45:1, which put its thinnest
      // stroke at 0.77 CSS pixels once the scale came down to a comfortable
      // x-height. A sub-pixel light stroke on a dark ground cannot be drawn,
      // only smeared. Alegreya runs 1.49:1, the lowest of thirteen faces
      // measured, and holds 1.18px at the same x-height.
      //
      // Weights are 400 and 700, both of which Alegreya ships.
      name: "Alegreya",
      cssVariable: "--font-display",
      provider: fontProviders.google(),
      fallbacks: ["Palatino", "Georgia", "serif"],
      weights: [400, 700],
      styles: ["normal"],
      formats: ["woff2"],
    },
    {
      // Body is Alegreya too — one family for the whole site. It was drawn
      // for book-length text, so it can carry running copy as well as
      // titles, and a single voice suits a theme whose argument is that
      // space and size carry hierarchy rather than contrast between faces.
      // Registered separately from --font-display because the OG image
      // generator resolves both variables through astro:fonts; the pipeline
      // shares the underlying files.
      name: "Alegreya",
      cssVariable: "--font-body",
      provider: fontProviders.google(),
      fallbacks: ["Palatino", "Georgia", "serif"],
      weights: [400, 700],
      styles: ["normal", "italic"],
      formats: ["woff2"],
    },
    {
      name: "Google Sans Code",
      cssVariable: "--font-google-sans-code",
      provider: fontProviders.google(),
      fallbacks: ["monospace"],
      weights: [400],
      styles: ["normal"],
      formats: ["woff2"],
    },
    {
      // TrueType, for the OG image generator alone — `satori` cannot read
      // woff2, and `getFontPathByWeight` asks for `format: "truetype"`.
      //
      // It is a SEPARATE entry so that no reader ever downloads it. Astro
      // emits one @font-face per format, and the TrueType block carries no
      // `unicode-range` while the woff2 blocks do; declared under the same
      // family name it therefore matched every Latin codepoint AND came last,
      // so the cascade handed the browser a 378KB TTF and the 15KB woff2 was
      // never fetched at all. Measured, not assumed. Under its own variable
      // the face is declared and never referenced, so it is never loaded.
      name: "Alegreya",
      cssVariable: "--font-og",
      provider: fontProviders.google(),
      fallbacks: ["serif"],
      weights: [400],
      styles: ["normal"],
      formats: ["ttf"],
    },
  ],
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
});
