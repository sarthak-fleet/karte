import 'server-only';

import type { PageDomainStatus, PageDomainVerification } from '@/db/schema';

import {
  type DnsInstruction,
  getDnsInstructions as sharedGetDnsInstructions,
} from './hostname';

export type VercelDomainStatus = {
  status: PageDomainStatus;
  verification: PageDomainVerification[];
  errorMessage?: string;
  configured: boolean;
};

export type { DnsInstruction };

export const getDnsInstructions = sharedGetDnsInstructions;

const VERCEL_API = 'https://api.vercel.com';

/**
 * Vercel will only be hit when both VERCEL_TOKEN and VERCEL_PROJECT_ID are set.
 * Without them, the wrapper falls back to a stub that records the hostname as
 * pending and returns generic DNS instructions — useful for local dev and for
 * the Cloudflare Workers deployment where Vercel isn't the host.
 */
export function isVercelConfigured(): boolean {
  return Boolean(process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID);
}

function vercelHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

function teamQuery(): string {
  const id = process.env.VERCEL_TEAM_ID;
  return id ? `?teamId=${encodeURIComponent(id)}` : '';
}

type VercelDomainResponse = {
  name?: string;
  verified?: boolean;
  verification?: { type: string; domain: string; value: string; reason?: string }[];
  error?: { code?: string; message?: string };
};

function mapVerification(
  raw: VercelDomainResponse['verification'],
): PageDomainVerification[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((v) => ({
    type: v.type,
    domain: v.domain,
    value: v.value,
    reason: v.reason,
  }));
}

export async function addDomain(hostname: string): Promise<VercelDomainStatus> {
  if (!isVercelConfigured()) {
    return {
      status: 'pending',
      verification: [],
      configured: false,
    };
  }

  const project = encodeURIComponent(process.env.VERCEL_PROJECT_ID!);
  const res = await fetch(
    `${VERCEL_API}/v10/projects/${project}/domains${teamQuery()}`,
    {
      method: 'POST',
      headers: vercelHeaders(),
      body: JSON.stringify({ name: hostname }),
    },
  );

  if (res.status === 409) {
    // Already attached — fall through to a status fetch instead of failing.
    return getDomainStatus(hostname);
  }

  const json = (await res.json().catch(() => ({}))) as VercelDomainResponse;
  if (!res.ok) {
    return {
      status: 'error',
      verification: [],
      configured: true,
      errorMessage: json.error?.message ?? `Vercel returned ${res.status}`,
    };
  }

  return {
    status: json.verified ? 'verified' : 'verifying',
    verification: mapVerification(json.verification),
    configured: true,
  };
}

export async function getDomainStatus(hostname: string): Promise<VercelDomainStatus> {
  if (!isVercelConfigured()) {
    return { status: 'pending', verification: [], configured: false };
  }

  const project = encodeURIComponent(process.env.VERCEL_PROJECT_ID!);
  const name = encodeURIComponent(hostname);
  const res = await fetch(
    `${VERCEL_API}/v9/projects/${project}/domains/${name}${teamQuery()}`,
    { method: 'GET', headers: vercelHeaders() },
  );

  const json = (await res.json().catch(() => ({}))) as VercelDomainResponse;

  if (!res.ok) {
    return {
      status: 'error',
      verification: [],
      configured: true,
      errorMessage: json.error?.message ?? `Vercel returned ${res.status}`,
    };
  }

  // Verify endpoint to refresh the configured/verified flag.
  const verifyRes = await fetch(
    `${VERCEL_API}/v9/projects/${project}/domains/${name}/verify${teamQuery()}`,
    { method: 'POST', headers: vercelHeaders() },
  );
  const verifyJson = (await verifyRes.json().catch(() => ({}))) as VercelDomainResponse;

  const verified = Boolean(verifyJson.verified ?? json.verified);
  const verification = mapVerification(verifyJson.verification ?? json.verification);

  return {
    status: verified ? 'verified' : verification.length > 0 ? 'verifying' : 'pending',
    verification,
    configured: true,
  };
}

export async function removeDomain(hostname: string): Promise<void> {
  if (!isVercelConfigured()) return;
  const project = encodeURIComponent(process.env.VERCEL_PROJECT_ID!);
  const name = encodeURIComponent(hostname);
  await fetch(
    `${VERCEL_API}/v9/projects/${project}/domains/${name}${teamQuery()}`,
    { method: 'DELETE', headers: vercelHeaders() },
  ).catch(() => undefined);
}
