import { getCloudflareContext } from '@opennextjs/cloudflare';

import { hitSlidingWindow } from './rate-limit-window';

const DEFAULT_WINDOW_MS = 60_000; // 1 minute
const DEFAULT_MAX_REQUESTS = 20;

// How long to wait on the Durable Object before failing open. The limiter
// must never take down chat/generation endpoints — a slow or unavailable
// store degrades to the in-memory limiter instead of blocking the request.
const STORE_TIMEOUT_MS = 1_000;

interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  /** Route label for the hit/limit counter log line. */
  endpoint?: string;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
}

type RateLimitOutcome = 'allowed' | 'limited' | 'observed';

/**
 * Lightweight hit/limit counter: one structured log line per decision,
 * greppable in Workers Logs via the `[rate-limit]` prefix. `observed` marks
 * endpoints that have no limiter — the line exists purely to gather traffic
 * evidence (fleet rule: no new limits without endpoint-specific evidence).
 * Note: wrangler observability samples at 10%, so treat counts as a sample.
 */
export function logRateLimitEvent(
  endpoint: string,
  outcome: RateLimitOutcome,
  detail: Record<string, string | number> = {},
) {
  const extra = Object.entries(detail)
    .map(([k, v]) => ` ${k}=${v}`)
    .join('');
  console.info(`[rate-limit] endpoint=${endpoint} outcome=${outcome}${extra}`);
}

// --- Durable store (RateLimiterDO — see rate-limiter-do.mjs) ---

interface RateLimiterStub {
  hit(windowMs: number, maxRequests: number): Promise<RateLimitResult>;
}

interface RateLimiterNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): RateLimiterStub;
}

function getRateLimiterNamespace(): RateLimiterNamespace | null {
  try {
    const { env } = getCloudflareContext();
    return (
      ((env as Record<string, unknown>).RATE_LIMITER_DO as
        | RateLimiterNamespace
        | undefined) ?? null
    );
  } catch {
    // Outside the Workers runtime (unit tests, local tooling).
    return null;
  }
}

async function hitDurable(
  ns: RateLimiterNamespace,
  key: string,
  windowMs: number,
  maxRequests: number,
): Promise<RateLimitResult> {
  const stub = ns.get(ns.idFromName(key));
  const hit = stub.hit(windowMs, maxRequests);
  // Swallow post-timeout rejections so they don't surface as unhandled.
  hit.catch(() => {});
  return await Promise.race([
    hit,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('rate-limit store timeout')),
        STORE_TIMEOUT_MS,
      ),
    ),
  ]);
}

// --- In-memory fallback (per-isolate; the pre-durable behavior) ---
// Primary path in local dev, fail-open path in production.

const windows = new Map<string, number[]>();

function rateLimitInMemory(
  key: string,
  windowMs: number,
  maxRequests: number,
): RateLimitResult {
  const now = Date.now();
  const { ok, remaining, timestamps } = hitSlidingWindow(
    windows.get(key) ?? [],
    now,
    windowMs,
    maxRequests,
  );
  windows.set(key, timestamps);

  // Cleanup old keys periodically
  if (windows.size > 10_000) {
    for (const [k, v] of windows) {
      if (v.every((t) => now - t >= windowMs)) windows.delete(k);
    }
  }

  return { ok, remaining };
}

/**
 * Sliding-window rate limit backed by a Durable Object so counts survive
 * deploys and are shared across isolates. Thresholds are unchanged from the
 * original in-memory limiter (default 20 req/min per key).
 *
 * Fails open: when the durable store is missing (local dev) or errors/times
 * out, the per-isolate in-memory limiter — the previous behavior — takes
 * over instead of blocking the request.
 */
export async function rateLimit(
  key: string,
  opts?: RateLimitOptions,
): Promise<RateLimitResult> {
  const windowMs = opts?.windowMs ?? DEFAULT_WINDOW_MS;
  const maxRequests = opts?.maxRequests ?? DEFAULT_MAX_REQUESTS;

  let result: RateLimitResult;
  let store: 'durable' | 'memory' = 'durable';

  const ns = getRateLimiterNamespace();
  if (ns) {
    try {
      result = await hitDurable(ns, key, windowMs, maxRequests);
    } catch (err) {
      console.error(
        '[rate-limit] durable store error — failing open to in-memory:',
        err,
      );
      store = 'memory';
      result = rateLimitInMemory(key, windowMs, maxRequests);
    }
  } else {
    store = 'memory';
    result = rateLimitInMemory(key, windowMs, maxRequests);
  }

  if (opts?.endpoint) {
    logRateLimitEvent(opts.endpoint, result.ok ? 'allowed' : 'limited', {
      store,
      remaining: result.remaining,
    });
  }

  return result;
}
