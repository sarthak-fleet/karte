import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

// Enables Next.js ISR / `revalidate` on Cloudflare Workers. Rendered HTML
// is stored in R2 (linkchat-cache bucket) keyed by route, and a Durable
// Object queue handles background revalidation when a cache entry goes
// stale. Without this config, OpenNext skips caching entirely and every
// request re-renders + re-queries the DB, producing private/no-cache
// headers regardless of what page-level `revalidate` exports declare.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
});
