'use client';

import { useState } from 'react';

type Verification = { type: string; domain: string; value: string; reason?: string };
type DnsInstruction = { type: 'A' | 'CNAME'; name: string; value: string };

export type DomainRow = {
  id: string;
  pageId: string;
  hostname: string;
  status: 'pending' | 'verifying' | 'verified' | 'error';
  isPrimary: boolean;
  verification: Verification[] | null;
  errorMessage: string | null;
  lastCheckedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  dnsInstructions: DnsInstruction[];
};

const STATUS_BADGE: Record<DomainRow['status'], string> = {
  pending: 'bg-amber-300/15 text-amber-200 border-amber-300/30',
  verifying: 'bg-sky-300/15 text-sky-200 border-sky-300/30',
  verified: 'bg-emerald-300/15 text-emerald-200 border-emerald-300/30',
  error: 'bg-rose-300/15 text-rose-200 border-rose-300/30',
};

export function DomainEditor({
  pageId,
  initial,
}: {
  pageId: string;
  initial: DomainRow[];
}) {
  const [domains, setDomains] = useState(initial);
  const [hostname, setHostname] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/pages/${pageId}/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostname }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to add domain');
      setDomains((prev) => [...prev, json]);
      setHostname('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add domain');
    } finally {
      setSubmitting(false);
    }
  }

  async function verify(domainId: string) {
    const res = await fetch(`/api/pages/${pageId}/domains/${domainId}/verify`, {
      method: 'POST',
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? 'Verification failed');
      return;
    }
    setDomains((prev) => prev.map((d) => (d.id === domainId ? json : d)));
  }

  async function makePrimary(domainId: string) {
    const res = await fetch(`/api/pages/${pageId}/domains/${domainId}/primary`, {
      method: 'POST',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? 'Failed to set primary');
      return;
    }
    setDomains((prev) =>
      prev.map((d) => ({ ...d, isPrimary: d.id === domainId })),
    );
  }

  async function remove(domainId: string) {
    if (!confirm('Remove this domain?')) return;
    const res = await fetch(`/api/pages/${pageId}/domains/${domainId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? 'Failed to remove domain');
      return;
    }
    setDomains((prev) => prev.filter((d) => d.id !== domainId));
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={add}
        className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-1 text-xs uppercase tracking-wider text-gray-400">
          Add a domain
          <input
            type="text"
            placeholder="example.com"
            required
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            className="rounded-lg border border-white/10 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
          />
        </label>
        <button
          type="submit"
          disabled={submitting || !hostname.trim()}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Add domain'}
        </button>
      </form>

      {error && (
        <div className="rounded-2xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      {domains.length === 0 ? (
        <p className="text-sm text-gray-500">No custom domains yet.</p>
      ) : (
        <ul className="space-y-4">
          {domains.map((d) => (
            <li
              key={d.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-white">
                    {d.hostname}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${STATUS_BADGE[d.status]}`}
                  >
                    {d.status}
                  </span>
                  {d.isPrimary && (
                    <span className="rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white">
                      Primary
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => verify(d.id)}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white hover:bg-white/10"
                  >
                    Retry verify
                  </button>
                  {d.status === 'verified' && !d.isPrimary && (
                    <button
                      onClick={() => makePrimary(d.id)}
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white hover:bg-white/10"
                    >
                      Set primary
                    </button>
                  )}
                  <button
                    onClick={() => remove(d.id)}
                    className="rounded-lg border border-rose-300/30 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-300/10"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {d.errorMessage && (
                <p className="mt-2 text-xs text-rose-200">{d.errorMessage}</p>
              )}

              <div className="mt-3 grid gap-2 text-xs text-gray-300">
                <p className="text-gray-400">Add these DNS records:</p>
                {d.dnsInstructions.map((rec, i) => (
                  <div
                    key={`${rec.type}-${i}`}
                    className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-gray-950 px-3 py-2 font-mono text-[11px]"
                  >
                    <span>
                      <span className="text-gray-500">type</span> {rec.type}
                    </span>
                    <span>
                      <span className="text-gray-500">name</span> {rec.name}
                    </span>
                    <span className="truncate">
                      <span className="text-gray-500">value</span> {rec.value}
                    </span>
                  </div>
                ))}
                {d.verification && d.verification.length > 0 && (
                  <>
                    <p className="text-gray-400">Vercel verification records:</p>
                    {d.verification.map((v, i) => (
                      <div
                        key={`v-${i}`}
                        className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-gray-950 px-3 py-2 font-mono text-[11px]"
                      >
                        <span>
                          <span className="text-gray-500">type</span> {v.type}
                        </span>
                        <span className="truncate">
                          <span className="text-gray-500">name</span> {v.domain}
                        </span>
                        <span className="truncate">
                          <span className="text-gray-500">value</span> {v.value}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
