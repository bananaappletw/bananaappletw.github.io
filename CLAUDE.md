# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Astro-based personal blog and knowledge base built with [AstroPaper](https://astro-paper.pages.dev/) theme. The site is hosted on GitHub Pages at `https://bananaappletw.github.io/`.

**Recent migration**: Project was migrated from Docusaurus to Astro in June 2026. Content structure is simpler now:
- Blog posts in `src/content/blog/`
- Archive posts in `src/content/archives/`
- Markdown files use frontmatter for metadata (title, author, pubDate, tags, etc.)

## Development Commands

- **Install dependencies**: `npm install` (Node.js >=22.0.0 required)
- **Local development**: `npm run dev` - Starts dev server at `http://localhost:3000` with hot reloading
- **Build for production**: `npm run build` - Generates static site in `dist/` and runs Pagefind indexing
- **Preview built site**: `npm run preview` - Serves the built `dist/` directory locally
- **Run tests**: `npm test` - vitest; enforces the design system's contrast floors and the no-hardcoded-colour rule
- **Regenerate tokens**: `npm run build:tokens` - writes `src/styles/tokens.css` from `docs/theme/tokens.json` (also runs automatically on `dev` and `build`)
- **Format code**: `npm run format:check` / `npm run format` - Prettier formatting
- **Lint code**: `npm run lint` - ESLint checks (currently broken: no `eslint.config.js`, see `docs/theme/design.md` §15)

## Theme: Torchlight

The site runs a custom theme built on FromSoftware's design language, replacing AstroPaper's presentation layer. **Read `docs/theme/design.md` before changing anything visual.**

Two rules that are easy to break and enforced by tests:

- **No hex literal may appear anywhere under `src/`.** Every colour comes from `docs/theme/tokens.json`, which `scripts/build-tokens.mjs` compiles into `src/styles/tokens.css`. Never hand-edit that file.
- **Gold (`--torch`) appears at most three times in a viewport.** It is rare relief, not an accent. Links are neutral until hovered; listing titles, tags and nav are never gold.

Two worlds, not a light/dark toggle: `hollowed` (default, warm sepia) and `kindled` (white). `data-theme` accepts `hollowed`/`kindled` plus the `dark`/`light` aliases. First visit always lands hollowed.

Traps discovered while building it, both recorded in the spec's anti-patterns:

- Tailwind hoists `position: fixed` and `inset: 0` into utilities and **strips them from hand-written rules** — the atmosphere layers apply them as classes in `Layout.astro` instead.
- Write `-webkit-backdrop-filter` **before** the unprefixed property, or minification keeps only the prefixed one.

## Architecture Notes

- **Framework**: Astro v6 with TypeScript
- **Styling**: Tailwind CSS v4 with @tailwindcss/typography plugin
- **Markdown Processing**: 
  - MDX support via @astrojs/mdx
  - Remark plugins: remark-toc, remark-collapse, remark-mermaid
  - Syntax highlighting via Shiki with transformers (diffs, highlights, word highlights, file names)
- **Content Search**: Pagefind for full-text search (indexed at build time, UI at `/pagefind/`)
- **SEO**: Sitemap generation, dynamic OG images, RSS feeds
- **Dark Mode**: Default dark theme with light/dark mode toggle available

## Key Configuration Files

- `astro.config.ts` - Astro configuration with integrations, markdown processors, fonts
- `torchlight.config.ts` - Site config (metadata, feature flags, social links)
- `docs/theme/tokens.json` - single source of truth for all colour
- `docs/theme/design.md` - the design system spec
- `src/types/config.ts` - TypeScript types for configuration
- `tailwind.config.ts` - Tailwind CSS configuration (if present)
- `tsconfig.json` - TypeScript settings
- `.eslintrc.*` - ESLint rules

## Content Management

- Posts stored in `src/content/blog/` and `src/content/archives/` as `.md` or `.mdx` files
- Frontmatter schema includes: title, author, pubDate, tags, description, draft status
- Scheduled posts supported via `scheduledPostMargin` setting in astro-paper.config.ts
- Archive posts can be hidden by setting `showArchives: false` in config

## Building & Deployment

- **Local builds**: `npm run build` generates static files + Pagefind index
- **GitHub Actions**: Push to `main` branch triggers automatic deployment to GitHub Pages
- Build output in `dist/` directory; search index in `dist/pagefind/` (symlinked to `public/pagefind/`)