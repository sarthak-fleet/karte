/**
 * Pure hostname helpers shared between middleware, server libs, and tests.
 * No `server-only` import — safe to use anywhere.
 */
const HOSTNAME_RE = /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}(?<!-)\.)+[a-z]{2,63}$/;

export function normalizeHostname(input: string | null | undefined): string | null {
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

export function isAppHost(host: string, appHost: string | null | undefined): boolean {
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
  const isApex = hostname.split('.').length === 2;
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
