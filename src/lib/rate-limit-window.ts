/**
 * Pure sliding-window-log decision shared by the durable RateLimiterDO
 * (rate-limiter-do.mjs) and the in-memory fallback in rate-limit.ts.
 *
 * Mirrors the original in-memory limiter semantics exactly: prune entries
 * older than windowMs, reject when the window is full (without recording
 * the rejected hit), otherwise record `now`.
 */
export interface SlidingWindowResult {
  ok: boolean;
  remaining: number;
  /** Pruned timestamps to persist for the next call (includes `now` when allowed). */
  timestamps: number[];
}

export function hitSlidingWindow(
  previous: number[],
  now: number,
  windowMs: number,
  maxRequests: number,
): SlidingWindowResult {
  const valid = previous.filter((t) => now - t < windowMs);

  if (valid.length >= maxRequests) {
    return { ok: false, remaining: 0, timestamps: valid };
  }

  valid.push(now);
  return { ok: true, remaining: maxRequests - valid.length, timestamps: valid };
}
