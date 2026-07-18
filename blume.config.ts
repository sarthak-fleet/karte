// Blume documentation site config.
//
// Blume is the PRESENTATION + SEARCH layer only. The Markdown under `docs/`
// remains the source of truth; this file only describes how to render it.
//
// Blume is invoked via `npx blume` (not a package dependency), so this file is
// excluded from `tsconfig.json` and does not affect the install/lockfile.
// Run:  npx blume dev   |   npx blume build
//
// Docs: https://useblume.dev/docs/configuration
import { defineConfig } from "blume";

export default defineConfig({
  title: "Karte docs",
  description:
    "Local-first knowledge system for Karte (linkchat) — a link-in-bio platform with AI-enhanced profile modes on Cloudflare Workers.",

  content: {
    // The committed docs tree is the source of truth.
    root: "docs",
    // Archive is historical context; include it but it's not the primary nav.
    include: ["**/*.{md,mdx}"],
  },

  theme: {
    accent: "cyan",
    radius: "md",
    mode: "system",
  },

  search: {
    provider: "orama",
  },

  markdown: {
    imageZoom: true,
    code: {
      icons: true,
      wrap: false,
    },
  },

  ai: {
    llmsTxt: true,
  },

  seo: {
    og: { enabled: true },
    sitemap: true,
    robots: true,
    structuredData: true,
  },

  deployment: {
    output: "static",
    // TODO(docs): confirm the docs site origin and update before publishing.
    // Left unset on purpose so Blume doesn't emit wrong canonical URLs.
    // site: "https://docs.karte.cc",
  },
});
