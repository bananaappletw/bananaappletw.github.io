# bananaappletw.github.io

A personal blog and knowledge base built with [Astro](https://astro.build/) using the [AstroPaper](https://astro-paper.pages.dev/) theme. Hosted on GitHub Pages at https://bananaappletw.github.io/

## Requirements

- Node.js >=22.0.0
- npm or yarn

## Installation

```console
npm install
```

## Local Development

```console
npm run dev
```

Starts a local development server at `http://localhost:4321` with hot reloading. Changes are reflected live without restarting the server.

## Build

```console
npm run build
```

Generates static content into the `dist/` directory and creates a Pagefind search index at `dist/pagefind/`. Ready to be served by any static content hosting service.

## Preview Built Site

```console
npm run preview
```

Serves the built `dist/` directory locally for testing before deployment.

## Formatting & Linting

```console
npm run format:check  # Check formatting
npm run format       # Apply Prettier formatting
npm run lint         # Run ESLint
```

## Deployment

Push to the `main` branch to trigger automatic deployment to GitHub Pages via GitHub Actions.
