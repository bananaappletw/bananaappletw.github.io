# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Docusaurus v2 website that serves as a personal blog and knowledge base. The site is hosted on GitHub Pages and contains multiple content sections:
- Blog posts (`/blog`)
- Archives (`/archives`) 
- Treasure (special content) (`/treasure`)

## Development Commands

- **Install dependencies**: `yarn install`
- **Local development**: `yarn start` - Starts a local development server with hot reloading
- **Build for production**: `yarn build` - Generates static content in the `build` directory
- **Serve built site locally**: `yarn serve` - Serves the built site locally for testing
- **Lint code**: `yarn lint` - Runs ESLint on the codebase
- **Clear cache**: `yarn clear` - Clears the Docusaurus build cache

## Deployment

- **Manual deployment**: `GIT_USER=<username> USE_SSH=true yarn deploy`
- **Automatic deployment**: Push to the `main` branch triggers GitHub Actions deployment

## Content Structure

- `blog/` - Main blog posts with metadata frontmatter
- `archives/` - Archived articles and technical content
- `treasure/` - Special curated content
- `docs/` - Documentation pages (if any)
- `src/` - Custom React components, CSS, and pages
- `static/` - Static assets like images

## Architecture Notes

- Uses Docusaurus v2.3.1 with classic preset
- Custom themes and plugins including live code blocks and Mermaid diagrams
- Multiple blog instances configured via plugins for different content sections
- Dark mode is the default color mode
- Uses FontAwesome for icons
- Supports Mermaid diagrams in markdown files via remark-mermaid plugin

## Configuration Files

- `docusaurus.config.js` - Main configuration with multiple blog plugins
- `sidebars.js` - Sidebar navigation configuration
- `babel.config.js` - Babel configuration
- `package.json` - Dependencies and scripts
- `.eslintrc` - ESLint configuration
- `.github/workflows/deploy.yml` - GitHub Actions deployment workflow