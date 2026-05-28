// Stale-chunk handler.
//
// When the deployed code changes (new build, new chunk hashes) while
// users have an old page bundle open, client-side navigation can try
// to load chunks that no longer exist on the server. The result is a
// cryptic "l[e] is not a function" error from the webpack runtime, or
// a ChunkLoadError, or a generic "Loading chunk X failed" message —
// the symptom varies by browser and chunk type.
//
// In every case, the user's only real fix is to reload the page so a
// fresh HTML response gives them the current chunk references. This
// helper detects the pattern and triggers a single reload, gated by a
// short cooldown so we never end up in a reload loop on a different,
// unrelated error.

const COOLDOWN_KEY = 'karte:chunk-reload-at';
const COOLDOWN_MS = 30_000;

// Patterns that mean "stale chunk reference, reload will fix it." Kept
// narrow on purpose — we don't want to swallow real bugs.
const CHUNK_ERROR_PATTERNS = [
  /ChunkLoadError/i,
  /Loading chunk \d+ failed/i,
  /Loading CSS chunk \d+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
];

// The "l[e] is not a function" symptom is a webpack-runtime crash
// from a missing module ID. Match it by inspecting the stack for the
// webpack runtime entry point — broader patterns risk false positives.
function isWebpackRuntimeCrash(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const stack = err.stack ?? '';
  // Webpack chunk file names look like webpack-<hash>.js. The crash
  // frame originates there when modules[moduleId] is undefined.
  if (!/webpack-[a-f0-9]+\.js/.test(stack)) return false;
  // And the error itself is "X is not a function" or undefined access.
  return /is not a function|undefined is not an object/i.test(err.message);
}

function isChunkLoadError(err: unknown): boolean {
  if (!err) return false;
  const message =
    err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  const name = err instanceof Error ? err.name : '';
  if (CHUNK_ERROR_PATTERNS.some((re) => re.test(message))) return true;
  if (CHUNK_ERROR_PATTERNS.some((re) => re.test(name))) return true;
  if (isWebpackRuntimeCrash(err)) return true;
  return false;
}

/**
 * Returns true if the error looked like a stale-chunk issue and we
 * triggered a reload. Caller should NOT show its own error UI in that
 * case — the page is about to refresh.
 */
export function maybeReloadOnChunkError(err: unknown): boolean {
  if (typeof window === 'undefined') return false;
  if (!isChunkLoadError(err)) return false;

  // Cooldown so a real, persistent error doesn't loop. If we just
  // reloaded for the same reason a moment ago, skip.
  try {
    const last = Number(window.sessionStorage.getItem(COOLDOWN_KEY) ?? '0');
    if (Date.now() - last < COOLDOWN_MS) return false;
    window.sessionStorage.setItem(COOLDOWN_KEY, String(Date.now()));
  } catch {
    // sessionStorage unavailable (private mode, sandbox) — proceed
    // without the cooldown rather than skipping the reload entirely.
  }

  window.location.reload();
  return true;
}
