'use client';

import { useState } from 'react';

// Feature flag: custom domains register + verify on CF, but don't actually
// serve traffic without a Workers-for-Platforms migration. Until that ships,
// hide the add-domain form behind a notify-me CTA so we collect interest
// signal without exposing broken UX. Flip to true once the migration in
// docs/plans/custom-domains-migration.md is complete.
const CUSTOM_DOMAINS_LIVE = false;

type Verification = { type: string; domain: string; value: string; reason?: string };
type DnsInstruction = { type: 'A' | 'CNAME'; name: string; value: string; note?: string };

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

  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [primaryingId, setPrimaryingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [verifyToast, setVerifyToast] = useState<{ id: string; kind: 'ok' | 'err'; text: string } | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  async function copy(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((k) => (k === key ? null : k));
      }, 1500);
    } catch {
    }
  }

  function flashToast(id: string, kind: 'ok' | 'err', text: string) {
    setVerifyToast({ id, kind, text });
    window.setTimeout(() => {
      setVerifyToast((t) => (t && t.id === id ? null : t));
    }, 2400);
  }

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
    setError(null);
    setVerifyingId(domainId);
    const prevStatus = domains.find((d) => d.id === domainId)?.status;
    try {
      const res = await fetch(`/api/pages/${pageId}/domains/${domainId}/verify`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) {
        flashToast(domainId, 'err', json.error ?? 'Verification failed');
        return;
      }
      setDomains((prev) => prev.map((d) => (d.id === domainId ? json : d)));
      const nextStatus = json.status as DomainRow['status'];
      if (nextStatus === 'verified') {
        flashToast(domainId, 'ok', 'Verified ✓');
      } else if (nextStatus === 'error') {
        flashToast(domainId, 'err', json.errorMessage ?? 'Still failing');
      } else if (nextStatus === prevStatus) {
        flashToast(domainId, 'ok', 'Re-checked · still pending');
      } else {
        flashToast(domainId, 'ok', `Status: ${nextStatus}`);
      }
    } finally {
      setVerifyingId(null);
    }
  }

  async function makePrimary(domainId: string) {
    setError(null);
    setPrimaryingId(domainId);
    try {
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
    } finally {
      setPrimaryingId(null);
    }
  }

  async function remove(domainId: string) {
    if (!confirm('Remove this domain?')) return;
    setError(null);
    setRemovingId(domainId);
    try {
      const res = await fetch(`/api/pages/${pageId}/domains/${domainId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? 'Failed to remove domain');
        return;
      }
      setDomains((prev) => prev.filter((d) => d.id !== domainId));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {!CUSTOM_DOMAINS_LIVE && <NotifyCard />}

      <form
        onSubmit={add}
        hidden={!CUSTOM_DOMAINS_LIVE}
        className="flex flex-col gap-3 rounded-2xl border border-karte-border bg-white/[0.03] p-4 sm:flex-row sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
          <span>
            <span className="text-karte-accent/80">·</span> Add a custom hostname
          </span>
          <input
            type="text"
            placeholder="links.example.com"
            required
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            className="rounded-lg border border-karte-border bg-karte-bg px-3 py-2 text-[14px] font-normal tracking-[-0.005em] text-karte-text outline-none transition-colors duration-200 ease-[var(--karte-ease)] placeholder:text-karte-text-4 focus:border-white/30"
          />
        </label>
        <button
          type="submit"
          disabled={submitting || !hostname.trim()}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-5 py-2 text-[13px] font-medium text-zinc-950 transition-all duration-200 ease-[var(--karte-ease)] hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Add domain'}
        </button>
      </form>

      {CUSTOM_DOMAINS_LIVE && error && (
        <div className="rounded-2xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      {!CUSTOM_DOMAINS_LIVE ? null : domains.length === 0 ? (
        <p className="text-sm text-karte-text-4">No custom domains yet.</p>
      ) : (
        <ul className="space-y-4">
          {domains.map((d) => {
            const isVerifying = verifyingId === d.id;
            const isPrimarying = primaryingId === d.id;
            const isRemoving = removingId === d.id;
            const toast = verifyToast && verifyToast.id === d.id ? verifyToast : null;

            return (
              <li
                key={d.id}
                className="rounded-2xl border border-karte-border bg-white/[0.025] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[14px] text-karte-text">
                      {d.hostname}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${STATUS_BADGE[d.status]}`}
                    >
                      {d.status}
                    </span>
                    {d.isPrimary && (
                      <span className="rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-karte-text">
                        Primary
                      </span>
                    )}
                    {toast && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium animate-fade-up ${
                          toast.kind === 'ok'
                            ? 'bg-emerald-300/15 text-emerald-200'
                            : 'bg-rose-300/15 text-rose-200'
                        }`}
                      >
                        {toast.text}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => verify(d.id)}
                      disabled={isVerifying}
                      aria-busy={isVerifying}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-transparent px-3 py-1.5 text-[12px] font-medium text-karte-text-2 transition-all duration-200 ease-[var(--karte-ease)] hover:border-white/25 hover:bg-white/[0.05] hover:text-karte-text disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isVerifying ? (
                        <>
                          <Spinner />
                          Verifying…
                        </>
                      ) : (
                        'Retry verify'
                      )}
                    </button>
                    {d.status === 'verified' && !d.isPrimary && (
                      <button
                        onClick={() => makePrimary(d.id)}
                        disabled={isPrimarying}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-transparent px-3 py-1.5 text-[12px] font-medium text-karte-text-2 transition-all duration-200 ease-[var(--karte-ease)] hover:border-white/25 hover:bg-white/[0.05] hover:text-karte-text disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isPrimarying ? (
                          <>
                            <Spinner />
                            Setting…
                          </>
                        ) : (
                          'Set primary'
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => remove(d.id)}
                      disabled={isRemoving}
                      className="inline-flex items-center gap-1.5 rounded-full border border-rose-300/30 bg-transparent px-3 py-1.5 text-[12px] font-medium text-rose-200 transition-all duration-200 ease-[var(--karte-ease)] hover:border-rose-300/60 hover:bg-rose-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isRemoving ? (
                        <>
                          <Spinner />
                          Removing…
                        </>
                      ) : (
                        'Remove'
                      )}
                    </button>
                  </div>
                </div>

                {d.errorMessage && (
                  <p className="mt-3 text-[12px] text-rose-200">{d.errorMessage}</p>
                )}

                <ValidationSections
                  domain={d}
                  copiedKey={copiedKey}
                  onCopy={copy}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Groups the verification records into the three labeled validation options
// users can choose from. Each section explains what the option does and what
// trade-off it represents.
function ValidationSections({
  domain,
  copiedKey,
  onCopy,
}: {
  domain: DomainRow;
  copiedKey: string | null;
  onCopy: (key: string, value: string) => void;
}) {
  const verification = domain.verification ?? [];
  const dcvCname = verification.find((v) => v.reason === 'dcv-delegation');
  const prevalTxt = verification.find((v) => v.reason === 'prevalidation-txt');
  const acmeTxt = verification.find((v) => v.reason === 'acme-txt');
  const acmeCname = verification.find((v) => v.reason === 'acme-cname');
  const acmeHttp = verification.find((v) => v.reason === 'acme-http');
  const ownership = verification.find((v) => v.reason === 'hostname-ownership');

  const hasAnyValidation =
    Boolean(dcvCname) ||
    Boolean(prevalTxt) ||
    Boolean(acmeTxt) ||
    Boolean(acmeCname) ||
    Boolean(acmeHttp);

  return (
    <div className="mt-5 space-y-6">
      {/* CNAME for the hostname itself */}
      {domain.dnsInstructions.length > 0 && (
        <Section
          eyebrow="Step 1 · Point the hostname"
          tagline="Required. CNAME your hostname to Karte so traffic reaches us."
        >
          {domain.dnsInstructions.map((rec, i) => (
            <DnsRecordRow
              key={`${domain.id}-rec-${i}`}
              rowKey={`${domain.id}-rec-${i}`}
              type={rec.type}
              name={rec.name}
              value={rec.value}
              note={rec.note}
              copiedKey={copiedKey}
              onCopy={onCopy}
            />
          ))}
        </Section>
      )}

      {hasAnyValidation && (
        <Section
          eyebrow="Step 2 · Prove ownership for SSL"
          tagline="Pick ONE of the options below. You don't need to add all of them."
        >
          {/* Option A — DCV delegation CNAME (recommended) */}
          {dcvCname && (
            <OptionCard
              tag="Recommended"
              title="A. CNAME delegation"
              blurb="Set this once. Cloudflare auto-renews your SSL cert from now on — you never have to touch DNS for SSL again."
              tone="recommended"
            >
              <DnsRecordRow
                rowKey={`${domain.id}-dcv`}
                type={dcvCname.type}
                name={dcvCname.domain}
                value={dcvCname.value}
                copiedKey={copiedKey}
                onCopy={onCopy}
              />
            </OptionCard>
          )}

          {/* Option B — Pre-validation TXT (instant if user's DNS is on Cloudflare) */}
          {prevalTxt && (
            <OptionCard
              tag="Instant if you use Cloudflare DNS"
              title="B. Pre-validation TXT"
              blurb="Validates immediately when your hostname's DNS is also on Cloudflare. Otherwise no faster than Option C."
              tone="info"
            >
              <DnsRecordRow
                rowKey={`${domain.id}-preval`}
                type={prevalTxt.type}
                name={prevalTxt.domain}
                value={prevalTxt.value}
                copiedKey={copiedKey}
                onCopy={onCopy}
              />
            </OptionCard>
          )}

          {/* Option C — ACME TXT (universal fallback) */}
          {(acmeTxt || acmeCname || acmeHttp) && (
            <OptionCard
              title="C. ACME validation record"
              blurb="Works on any DNS provider. Slowest path (DNS propagation + Let's Encrypt polling). You'll need to repeat this whenever the cert renews."
              tone="default"
            >
              {acmeTxt && (
                <DnsRecordRow
                  rowKey={`${domain.id}-acme-txt`}
                  type={acmeTxt.type}
                  name={acmeTxt.domain}
                  value={acmeTxt.value}
                  copiedKey={copiedKey}
                  onCopy={onCopy}
                />
              )}
              {acmeCname && (
                <DnsRecordRow
                  rowKey={`${domain.id}-acme-cname`}
                  type={acmeCname.type}
                  name={acmeCname.domain}
                  value={acmeCname.value}
                  copiedKey={copiedKey}
                  onCopy={onCopy}
                />
              )}
              {acmeHttp && (
                <DnsRecordRow
                  rowKey={`${domain.id}-acme-http`}
                  type={acmeHttp.type}
                  name={acmeHttp.domain}
                  value={acmeHttp.value}
                  copiedKey={copiedKey}
                  onCopy={onCopy}
                />
              )}
            </OptionCard>
          )}
        </Section>
      )}

      {ownership && (
        <Section
          eyebrow="Hostname ownership"
          tagline="Cloudflare may also ask for this record if hostname pre-validation is required."
        >
          <DnsRecordRow
            rowKey={`${domain.id}-ownership`}
            type={ownership.type}
            name={ownership.domain}
            value={ownership.value}
            copiedKey={copiedKey}
            onCopy={onCopy}
          />
        </Section>
      )}
    </div>
  );
}

function Section({
  eyebrow,
  tagline,
  children,
}: {
  eyebrow: string;
  tagline?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
          <span className="text-karte-accent/80">·</span> {eyebrow}
        </p>
        {tagline && (
          <p className="mt-1.5 text-[13px] leading-[1.55] text-karte-text-3">
            {tagline}
          </p>
        )}
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function OptionCard({
  tag,
  title,
  blurb,
  tone,
  children,
}: {
  tag?: string;
  title: string;
  blurb: string;
  tone: 'recommended' | 'info' | 'default';
  children: React.ReactNode;
}) {
  const accentClass =
    tone === 'recommended'
      ? 'border-emerald-300/25 bg-emerald-300/[0.04]'
      : tone === 'info'
        ? 'border-sky-300/20 bg-sky-300/[0.03]'
        : 'border-karte-border bg-white/[0.02]';

  const tagClass =
    tone === 'recommended'
      ? 'bg-emerald-300/15 text-emerald-200'
      : tone === 'info'
        ? 'bg-sky-300/15 text-sky-200'
        : 'bg-white/[0.06] text-karte-text-3';

  return (
    <div className={`rounded-xl border ${accentClass} p-3.5 space-y-2.5`}>
      <div className="flex flex-wrap items-baseline gap-2">
        <h4 className="text-[13px] font-semibold tracking-[-0.005em] text-karte-text">
          {title}
        </h4>
        {tag && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] ${tagClass}`}
          >
            {tag}
          </span>
        )}
      </div>
      <p className="text-[12px] leading-[1.55] text-karte-text-3">{blurb}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function DnsRecordRow({
  rowKey,
  type,
  name,
  value,
  note,
  copiedKey,
  onCopy,
}: {
  rowKey: string;
  type: string;
  name: string;
  value: string;
  note?: string;
  copiedKey: string | null;
  onCopy: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-1 gap-1.5 rounded-xl border border-karte-border bg-karte-bg p-2 sm:grid-cols-[120px_minmax(0,1fr)_minmax(0,1.6fr)]">
        <CopyField
          label="type"
          value={type}
          keyName={`${rowKey}-type`}
          copiedKey={copiedKey}
          onCopy={onCopy}
        />
        <CopyField
          label="name"
          value={name}
          keyName={`${rowKey}-name`}
          copiedKey={copiedKey}
          onCopy={onCopy}
        />
        <CopyField
          label="value"
          value={value}
          keyName={`${rowKey}-value`}
          copiedKey={copiedKey}
          onCopy={onCopy}
        />
      </div>
      {note && <p className="text-[11px] text-karte-text-4">{note}</p>}
    </div>
  );
}

function CopyField({
  label,
  value,
  keyName,
  copiedKey,
  onCopy,
}: {
  label: string;
  value: string;
  keyName: string;
  copiedKey: string | null;
  onCopy: (key: string, value: string) => void;
}) {
  const isCopied = copiedKey === keyName;
  return (
    <button
      type="button"
      onClick={() => onCopy(keyName, value)}
      title={`${label}: ${value} — click to copy`}
      className="group flex min-w-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-left font-mono text-[11px] text-karte-text-2 transition-colors duration-200 ease-[var(--karte-ease)] hover:bg-white/[0.04] hover:text-karte-text focus:outline-none focus:bg-white/[0.04]"
    >
      <span className="shrink-0 text-karte-text-4">{label}</span>
      <span className="min-w-0 flex-1 truncate">{value}</span>
      <span
        className={`shrink-0 text-[10px] font-medium uppercase tracking-[0.16em] transition-opacity duration-200 ${
          isCopied
            ? 'text-emerald-300 opacity-100'
            : 'text-karte-text-4 opacity-0 group-hover:opacity-100'
        }`}
        aria-live="polite"
      >
        {isCopied ? '✓ Copied' : 'Copy'}
      </span>
    </button>
  );
}

// Coming-soon CTA: collects interest signal via PostHog when present, otherwise
// just shows the success state locally. No DB write — we'll count signals from
// analytics when deciding whether to trigger the WfP migration.
function NotifyCard() {
  const [signaled, setSignaled] = useState(false);
  const [pending, setPending] = useState(false);

  async function notify() {
    setPending(true);
    try {
      // Fire-and-forget. Use the PostHog client if the provider has mounted it.
      // We don't await — UI feedback is immediate.
      if (typeof window !== 'undefined') {
        const ph = (window as unknown as { posthog?: { capture?: (e: string, p?: Record<string, unknown>) => void } }).posthog;
        ph?.capture?.('custom_domain_interest', {
          source: 'dashboard/domains',
        });
      }
      setSignaled(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-karte-border bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
        <span className="text-karte-accent/80">·</span> Roadmap
      </p>
      <h3 className="mt-3 text-[20px] font-semibold tracking-[-0.01em] text-karte-text">
        Custom domains — coming soon
      </h3>
      <p className="mt-2 max-w-prose text-[14px] leading-[1.6] text-karte-text-3">
        Soon you&apos;ll be able to point your own domain (like{' '}
        <code className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[12.5px] text-karte-text-2">
          you.com
        </code>{' '}
        or{' '}
        <code className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[12.5px] text-karte-text-2">
          links.you.com
        </code>
        ) at your profile. Until it ships, your profile lives at{' '}
        <code className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[12.5px] text-karte-text-2">
          karte.cc/&lt;your-slug&gt;
        </code>
        .
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {signaled ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-2 text-[13px] font-medium text-emerald-200">
            <span>✓</span> We&apos;ll email you when it&apos;s ready
          </div>
        ) : (
          <button
            type="button"
            onClick={notify}
            disabled={pending}
            className="group inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-5 py-2 text-[13px] font-medium text-zinc-950 transition-all duration-200 ease-[var(--karte-ease)] hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <>
                <Spinner />
                Recording…
              </>
            ) : (
              <>
                Notify me when it launches
                <span className="transition-transform duration-200 ease-[var(--karte-ease)] group-hover:translate-x-0.5">
                  →
                </span>
              </>
            )}
          </button>
        )}
        <span className="text-[12px] text-karte-text-4">
          No spam. One email when it ships.
        </span>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className="animate-spin"
    >
      <circle
        cx="6"
        cy="6"
        r="4.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeOpacity="0.25"
      />
      <path
        d="M10.5 6a4.5 4.5 0 0 0-4.5-4.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
