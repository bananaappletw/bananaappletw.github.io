# astro-paper Migration TODO

## Status: In Progress ✅

### Completed
- [x] Bootstrap astro-paper v6.4.2 with Astro 6, Node 22
- [x] Migrate 25 posts (5 blog + 19 archives + 1 treasure)
- [x] Merge sections into single `posts` collection with tags
- [x] Fix Tailwind CSS v4 compatibility (PostCSS setup)
- [x] Wire Mermaid diagrams via HTML + client-side rendering
- [x] Build succeeds (61 pages), dev server running
- [x] Remove example posts from astro-paper template

### In Progress
- [ ] Test all posts render correctly in browser
- [ ] Verify styling across dark/light modes
- [ ] Check mobile responsiveness

### Pending
- [ ] Merge `astro-paper-fresh` → `main` and deploy
- [ ] Set up GitHub Pages deployment workflow
- [ ] Add redirects for old URLs (if needed)
- [ ] Check for broken links post-migration

### Optional (Future)
- [ ] Wire admonitions (:::info, :::warning blocks) if used in posts
- [ ] Add back post edit links if GitHub repo is public
- [ ] Customize theme colors (currently using astro-paper defaults)
- [ ] Add custom fonts beyond Google Sans Code
- [ ] Enable comments (e.g., Giscus) if desired

## Current Metrics
- Posts: 22 (3 with Mermaid diagrams)
- Build time: ~30s
- Pages built: 61 (includes archives, tags, search, RSS)
- Node: 22.12.0
- Dev server: http://localhost:4322

## Known Issues
- None currently

## Notes
- i18n enabled by default (astro-paper architecture)
- Dark mode is the default color mode
- Search via Pagefind (post-build indexing)
- RSS feed at `/rss.xml`
- Sitemap at `/sitemap-index.xml`
