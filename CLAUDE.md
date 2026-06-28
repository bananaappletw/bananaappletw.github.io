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
- **Format code**: `npm run format:check` / `npm run format` - Prettier formatting
- **Lint code**: `npm run lint` - ESLint checks

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
- `astro-paper.config.ts` - Theme-specific config (site metadata, features flags, social links)
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