/**
 * Pure hostname helpers shared between server libs and tests.
 * No `server-only` import — safe to use anywhere.
 */
const HOSTNAME_RE =
  /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}(?<!-)\.)+[a-z]{2,63}$/;

/**
 * Extracts a display hostname from a full URL, stripping a leading `www.`.
 * Returns `fallback` (default `''`) when the input is empty or not a valid URL.
 */
export function hostnameFromUrl(
  url: string | null | undefined,
  fallback = '',
): string {
  if (!url) return fallback;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return fallback;
  }
}

export function normalizeHostname(
  input: string | null | undefined,
): string | null {
  if (typeof input !== 'string') return null;
  let host = input.trim().toLowerCase();
  if (!host) return null;

  if (host.startsWith('http://') || host.startsWith('https://')) {
    try {
      host = new URL(host).hostname.toLowerCase();
    } catch {
      return null;
    }
  }

  if (host.endsWith('.')) host = host.slice(0, -1);
  if (host.startsWith('www.')) host = host.slice(4);

  if (host.includes('/') || host.includes(':')) return null;

  if (host.length > 253) return null;
  if (!HOSTNAME_RE.test(host)) return null;
  return host;
}

// Karte's own brand domains — baked in because Next.js inlines NEXT_PUBLIC_*
// env vars at build time, making runtime env var bridging unreliable.
const KARTE_APP_HOSTS = new Set(['karte.cc', 'www.karte.cc']);
const MULTI_PART_PUBLIC_SUFFIXES = new Set([
  'co.uk',
  'org.uk',
  'ac.uk',
  'gov.uk',
  'com.au',
  'net.au',
  'org.au',
  'co.nz',
  'com.br',
  'com.mx',
  'co.jp',
  'ne.jp',
  'or.jp',
  'co.kr',
  'com.cn',
  'com.sg',
  'co.in',
  'in',
]);

function isApexHostname(hostname: string): boolean {
  const parts = hostname.toLowerCase().split('.');
  if (parts.length <= 2) return true;

  const suffix = parts.slice(-2).join('.');
  if (MULTI_PART_PUBLIC_SUFFIXES.has(suffix)) {
    return parts.length === 3;
  }

  return false;
}

export function isAppHost(
  host: string,
  appHost: string | null | undefined,
): boolean {
  if (!host) return false;
  const normalized = host.toLowerCase().split(':')[0];
  if (normalized === 'localhost') return true;
  if (normalized === '127.0.0.1' || normalized === '0.0.0.0') return true;
  if (normalized.endsWith('.workers.dev')) return true;
  if (normalized.endsWith('.vercel.app')) return true;
  if (KARTE_APP_HOSTS.has(normalized)) return true;
  if (appHost) {
    const app = appHost.toLowerCase().split(':')[0];
    if (normalized === app) return true;
    const apex = app.startsWith('www.') ? app.slice(4) : app;
    if (normalized === apex || normalized === `www.${apex}`) return true;
  }
  return false;
}

export function getAppHost(): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export type DnsInstruction = {
  type: 'A' | 'CNAME';
  name: string;
  value: string;
  note?: string;
};

export function getCustomDomainCnameTarget(): string {
  const explicit =
    process.env.NEXT_PUBLIC_CUSTOM_DOMAIN_CNAME_TARGET ??
    process.env.CLOUDFLARE_CUSTOM_HOSTNAME_CNAME_TARGET;
  if (explicit) return normalizeHostname(explicit) ?? explicit.trim();
  return getAppHost() ?? 'karte.cc';
}

export function getDnsInstructions(hostname: string): DnsInstruction[] {
  const target = getCustomDomainCnameTarget();
  const isApex = isApexHostname(hostname);
  if (isApex) {
    return [
      {
        type: 'CNAME',
        name: '@',
        value: target,
        note: 'Use CNAME flattening, ALIAS, or ANAME if your DNS provider does not allow apex CNAMEs.',
      },
      { type: 'CNAME', name: 'www', value: target },
    ];
  }
  const sub = hostname.split('.').slice(0, -2).join('.') || '@';
  return [{ type: 'CNAME', name: sub, value: target }];
}
