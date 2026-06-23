import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import type { NextConfig } from 'next';

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  // `next build` writes the standalone bundle to .next/standalone/ which
  // both Beasties (post-build inline-critical-css.mjs) and OpenNext need
  // to share. Without this, OpenNext's own build step regenerates the
  // standalone copy after Beasties runs, wiping the inlined CSS.
  output: 'standalone',
  reactCompiler: true,
  // experimental.useLightningcss intentionally NOT enabled: Next.js 16 is
  // strict about this — the flag throws "lightningcss-loader does not work
  // with postcss plugins" when Tailwind v4 is in the pipeline. Fleet
  // standard records Lightning CSS belongs in the Vite/Astro projects
  // where it can actually run; future Next.js Tailwind v4 work will pick
  // it up automatically once Next removes the postcss conflict.
  serverExternalPackages: [
    '@libsql/client',
    '@libsql/hrana-client',
    '@libsql/isomorphic-ws',
    'drizzle-orm',
  ],
  async headers() {
    // CF's edge PoP cache requires explicit Cache-Control to actually
    // cache responses. Even when a page is force-static + has
    // revalidate, Next.js doesn't always set the public Cache-Control
    // header — particularly under OpenNext for Cloudflare. Force it via
    // this config so CF caches /<slug> root pages at every PoP.
    return [
      {
        // Landing page — long TTL since it only changes on deploy.
        // 1 hr fresh + 1 day SWR keeps it instant for nearly all visits.
        source: '/',
        headers: [
          {
            // CF Edge was returning DYNAMIC for HTML with s-maxage alone;
            // adding an explicit max-age (browser cache) flips the edge
            // response to HIT. Both directives are now present.
            key: 'Cache-Control',
            value:
              'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        // Profile root pages — 60s TTL so owner edits propagate within
        // a minute. The negative lookahead excludes known route names.
        source:
          '/:slug((?!api|_next|dashboard|login|create|about|privacy|terms|favicon\\.ico|icon\\.svg|robots\\.txt|sitemap\\.xml|opengraph-image|manifest\\.webmanifest|\\.well-known).*[^/])',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },
  images: {
    // DiceBear + Google s2/favicons return SVG; next/image refuses SVG
    // by default for XSS reasons. We only proxy SVGs from a closed
    // whitelist of trusted hosts below and serve them with a CSP that
    // disables scripts/embeds, so the risk is minimal here.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      {
        protocol: 'https',
        hostname: 'pub-b339ffd5395643a28df3655ef3aa943d.r2.dev',
      },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      // Demo profile avatars + project logos.
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'www.google.com' },
      { protocol: 'https', hostname: 'github.com' },
    ],
  },
};

export default nextConfig;
