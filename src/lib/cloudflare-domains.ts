import 'server-only';

import type { PageDomainStatus, PageDomainVerification } from '@/db/schema';

import {
  type DnsInstruction,
  getDnsInstructions as sharedGetDnsInstructions,
} from './hostname';

export type DomainProviderStatus = {
  status: PageDomainStatus;
  verification: PageDomainVerification[];
  errorMessage?: string;
  configured: boolean;
};

export type { DnsInstruction };

export const getDnsInstructions = sharedGetDnsInstructions;

const CLOUDFLARE_API = 'https://api.cloudflare.com/client/v4';

type CloudflareError = {
  message?: string;
};

type CloudflareEnvelope<T> = {
  success?: boolean;
  errors?: CloudflareError[];
  result?: T;
};

type CloudflareValidationRecord = {
  cname?: string;
  cname_target?: string;
  http_url?: string;
  http_body?: string;
  status?: string;
  txt_name?: string;
  txt_value?: string;
};

type CloudflareDcvDelegationRecord = {
  cname?: string;
  cname_target?: string;
};

type CloudflareCustomHostname = {
  id?: string;
  hostname?: string;
  status?: string;
  ownership_verification?: {
    name?: string;
    type?: string;
    value?: string;
  };
  ssl?: {
    status?: string;
    validation_errors?: { message?: string }[];
    validation_records?: CloudflareValidationRecord[];
    dcv_delegation_records?: CloudflareDcvDelegationRecord[];
  };
  verification_errors?: string[];
};

type CloudflareListResult = CloudflareCustomHostname[];

export function isCloudflareCustomHostnamesConfigured(): boolean {
  return Boolean(
    process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ZONE_ID,
  );
}

function cloudflareHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

function customHostnamesUrl(path = '', query?: URLSearchParams): string {
  const zoneId = encodeURIComponent(process.env.CLOUDFLARE_ZONE_ID!);
  const suffix = query ? `?${query.toString()}` : '';
  return `${CLOUDFLARE_API}/zones/${zoneId}/custom_hostnames${path}${suffix}`;
}

function cloudflareError(
  json: CloudflareEnvelope<unknown>,
  fallback: string,
): string {
  return (
    json.errors
      ?.map((err) => err.message)
      .filter(Boolean)
      .join('; ') || fallback
  );
}

function mapProviderStatus(
  hostname: CloudflareCustomHostname,
): PageDomainStatus {
  if (hostname.status === 'active' && hostname.ssl?.status === 'active')
    return 'verified';
  if (
    hostname.status === 'blocked' ||
    hostname.status === 'test_blocked' ||
    hostname.status === 'test_failed'
  ) {
    return 'error';
  }
  return 'verifying';
}

// Verification records are tagged with a `reason` prefix so the UI can group
// them and explain each option to the user. Any single one of these is enough
// to validate the hostname — users don't need to add all of them.
function mapVerification(
  hostname: CloudflareCustomHostname,
): PageDomainVerification[] {
  const records: PageDomainVerification[] = [];

  // Option: pre-validation TXT — derived from the hostname's CF resource UUID.
  // Validates instantly (no waiting for ACME poll) when the user's DNS is on
  // a Cloudflare zone in this same account.
  if (hostname.id && hostname.hostname) {
    records.push({
      type: 'TXT',
      domain: `_cf-custom-hostname.${hostname.hostname}`,
      value: hostname.id,
      reason: 'prevalidation-txt',
    });
  }

  // Option: ACME TXT — what Let's Encrypt actually polls for. Slowest path
  // (DNS propagation + CF polling cycle) but works everywhere.
  for (const record of hostname.ssl?.validation_records ?? []) {
    if (record.txt_name && record.txt_value) {
      records.push({
        type: 'TXT',
        domain: record.txt_name,
        value: record.txt_value,
        reason: 'acme-txt',
      });
    }
    if (record.cname && record.cname_target) {
      records.push({
        type: 'CNAME',
        domain: record.cname,
        value: record.cname_target,
        reason: 'acme-cname',
      });
    }
    if (record.http_url && record.http_body) {
      records.push({
        type: 'HTTP',
        domain: record.http_url,
        value: record.http_body,
        reason: 'acme-http',
      });
    }
  }

  // Option: DCV delegation CNAME — set once, CF rotates certs forever after.
  // Recommended over a bare TXT for long-term operation.
  for (const record of hostname.ssl?.dcv_delegation_records ?? []) {
    if (record.cname && record.cname_target) {
      records.push({
        type: 'CNAME',
        domain: record.cname,
        value: record.cname_target,
        reason: 'dcv-delegation',
      });
    }
  }

  // Ownership verification (only present in some flows; kept for parity).
  const ownership = hostname.ownership_verification;
  if (ownership?.type && ownership.name && ownership.value) {
    records.push({
      type: ownership.type,
      domain: ownership.name,
      value: ownership.value,
      reason: 'hostname-ownership',
    });
  }

  return records;
}

function mapCustomHostname(
  hostname: CloudflareCustomHostname,
): DomainProviderStatus {
  const errorMessage =
    hostname.verification_errors?.join('; ') ||
    hostname.ssl?.validation_errors
      ?.map((err) => err.message)
      .filter(Boolean)
      .join('; ') ||
    undefined;

  return {
    status: errorMessage ? 'error' : mapProviderStatus(hostname),
    verification: mapVerification(hostname),
    errorMessage,
    configured: true,
  };
}

async function findCustomHostname(
  hostname: string,
): Promise<CloudflareCustomHostname | null> {
  const query = new URLSearchParams({ hostname });
  const res = await fetch(customHostnamesUrl('', query), {
    method: 'GET',
    headers: cloudflareHeaders(),
  });
  const json = (await res
    .json()
    .catch(() => ({}))) as CloudflareEnvelope<CloudflareListResult>;
  if (!res.ok) {
    throw new Error(cloudflareError(json, `Cloudflare returned ${res.status}`));
  }
  return json.result?.find((item) => item.hostname === hostname) ?? null;
}

export async function addDomain(
  hostname: string,
): Promise<DomainProviderStatus> {
  if (!isCloudflareCustomHostnamesConfigured()) {
    return {
      status: 'pending',
      verification: [],
      configured: false,
    };
  }

  const res = await fetch(customHostnamesUrl(), {
    method: 'POST',
    headers: cloudflareHeaders(),
    body: JSON.stringify({
      hostname,
      ssl: { method: 'txt', type: 'dv' },
    }),
  });
  const json = (await res
    .json()
    .catch(() => ({}))) as CloudflareEnvelope<CloudflareCustomHostname>;

  if (!res.ok) {
    if (res.status === 409) {
      const existing = await findCustomHostname(hostname);
      if (existing) return mapCustomHostname(existing);
    }
    return {
      status: 'error',
      verification: [],
      configured: true,
      errorMessage: cloudflareError(json, `Cloudflare returned ${res.status}`),
    };
  }

  return json.result
    ? mapCustomHostname(json.result)
    : { status: 'verifying', verification: [], configured: true };
}

export async function getDomainStatus(
  hostname: string,
): Promise<DomainProviderStatus> {
  if (!isCloudflareCustomHostnamesConfigured()) {
    return { status: 'pending', verification: [], configured: false };
  }

  const customHostname = await findCustomHostname(hostname);
  if (!customHostname) {
    return {
      status: 'pending',
      verification: [],
      configured: true,
      errorMessage: 'Cloudflare custom hostname has not been created yet.',
    };
  }

  return mapCustomHostname(customHostname);
}

export async function removeDomain(hostname: string): Promise<void> {
  if (!isCloudflareCustomHostnamesConfigured()) return;
  const customHostname = await findCustomHostname(hostname).catch(() => null);
  if (!customHostname?.id) return;

  await fetch(customHostnamesUrl(`/${encodeURIComponent(customHostname.id)}`), {
    method: 'DELETE',
    headers: cloudflareHeaders(),
  }).catch(() => undefined);
}
