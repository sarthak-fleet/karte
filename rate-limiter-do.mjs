// rate-limiter-do.mjs — Durable Object backing src/lib/rate-limit.ts.
//
// One object per rate-limit key (idFromName(key)), so counts survive deploys
// and are shared across Worker isolates — unlike the old in-memory Map that
// reset on every deploy. Storage holds a single pruned timestamp array; the
// decision logic is the same pure sliding window the in-memory fallback uses.
//
// Plain .mjs like worker.mjs/timing.mjs: worker-entry code that wrangler
// bundles directly (it compiles the shared TS import), outside `tsc --noEmit`.

import { DurableObject } from 'cloudflare:workers';

import { hitSlidingWindow } from './src/lib/rate-limit-window';

export class RateLimiterDO extends DurableObject {
  /**
   * Record a hit against this key's sliding window.
   * @param {number} windowMs
   * @param {number} maxRequests
   * @returns {Promise<{ ok: boolean; remaining: number }>}
   */
  async hit(windowMs, maxRequests) {
    const now = Date.now();
    const previous = (await this.ctx.storage.get('timestamps')) ?? [];
    const { ok, remaining, timestamps } = hitSlidingWindow(
      previous,
      now,
      windowMs,
      maxRequests,
    );
    await this.ctx.storage.put('timestamps', timestamps);
    // Wipe storage once a full window has passed since the last hit — every
    // stored timestamp is expired by then, so the object can hibernate and
    // be evicted instead of holding stale keys forever. Each hit pushes the
    // alarm forward.
    await this.ctx.storage.setAlarm(now + windowMs);
    return { ok, remaining };
  }

  async alarm() {
    await this.ctx.storage.deleteAll();
  }
}
