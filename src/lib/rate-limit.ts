const windows = new Map<string, number[]>();

const DEFAULT_WINDOW_MS = 60_000; // 1 minute
const DEFAULT_MAX_REQUESTS = 20;

interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
}

export function rateLimit(
  key: string,
  opts?: RateLimitOptions,
): { ok: boolean; remaining: number } {
  const windowMs = opts?.windowMs ?? DEFAULT_WINDOW_MS;
  const maxRequests = opts?.maxRequests ?? DEFAULT_MAX_REQUESTS;
  const now = Date.now();
  const timestamps = windows.get(key) ?? [];

  // Remove expired entries
  const valid = timestamps.filter((t) => now - t < windowMs);

  if (valid.length >= maxRequests) {
    windows.set(key, valid);
    return { ok: false, remaining: 0 };
  }

  valid.push(now);
  windows.set(key, valid);

  // Cleanup old keys periodically
  if (windows.size > 10_000) {
    for (const [k, v] of windows) {
      if (v.every((t) => now - t >= windowMs)) windows.delete(k);
    }
  }

  return { ok: true, remaining: maxRequests - valid.length };
}
