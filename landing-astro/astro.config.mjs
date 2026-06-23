// @ts-check

import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// Mirrors fleet/sarthakagrawal/astro.config.mjs, which is the reference
// 360 ms-LCP Astro setup. Pure static output (no SSR adapter) — the
// Onyx Deck is fully static markup. CSS is inlined into the HTML
// (`build.inlineStylesheets: 'always'`) so the LCP path is one round-
// trip: HTML → fonts → paint.
//
// Lightning CSS replaces the default PostCSS pipeline as both
// transformer and minifier (fleet web-stack standard, VoidZero / Vite
// ecosystem). See ../AGENTS.md → "Fleet web stack standard".
export default defineConfig({
  site: 'https://karte.cc',
  output: 'static',
  trailingSlash: 'never',
  // Emit `about.html` rather than `about/index.html` — no 308 redirect
  // on every link. Same as sarthakagrawal.pages.dev.
  build: {
    format: 'file',
    inlineStylesheets: 'always',
  },
  integrations: [sitemap()],
  vite: {
    css: { transformer: 'lightningcss' },
    build: { cssMinify: 'lightningcss' },
  },
});
