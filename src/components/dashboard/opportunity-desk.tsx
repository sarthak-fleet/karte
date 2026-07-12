'use client';

import { useEffect, useState } from 'react';

import type {
  CreatorOpportunityAnalysis,
  CreatorOpportunitySourceSnapshot,
  CreatorOpportunitySourceType,
  CreatorOpportunityStatus,
} from '@/db/schema';
import { buildOpportunityMailto } from '@/lib/creator-opportunities';

type Opportunity = {
  id: string;
  sourceType: CreatorOpportunitySourceType;
  sourceSnapshot: CreatorOpportunitySourceSnapshot;
  moment: string;
  target: string | null;
  creatorNotes: string | null;
  status: CreatorOpportunityStatus;
  analysis: CreatorOpportunityAnalysis | null;
  recipient: string | null;
  recipientVerified: boolean;
  draftSubject: string | null;
  draftBody: string | null;
  updatedAt: string | Date | null;
};

type Source = {
  type: Exclude<CreatorOpportunitySourceType, 'manual' | 'lead'>;
  id: string;
  label: string;
  summary: string;
  occurredAt?: string;
};

export function OpportunityDesk({ pageId }: { pageId: string }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [moment, setMoment] = useState('');
  const [target, setTarget] = useState('');
  const [sourceKey, setSourceKey] = useState('manual');
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setError('');
    const response = await fetch(`/api/pages/${pageId}/opportunities`);
    const data = (await response.json().catch(() => ({}))) as {
      opportunities?: Opportunity[];
      sources?: Source[];
      error?: string;
    };
    if (!response.ok)
      throw new Error(data.error || 'Could not load Opportunity Desk.');
    setOpportunities(data.opportunities ?? []);
    setSources(data.sources ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    refresh()
      .catch((caught: Error) => !cancelled && setError(caught.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [pageId]);

  async function createOpportunity(event: React.FormEvent) {
    event.preventDefault();
    if (!moment.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      const selected =
        sourceKey === 'manual'
          ? null
          : sources.find(
              (source) => `${source.type}:${source.id}` === sourceKey,
            );
      const response = await fetch(`/api/pages/${pageId}/opportunities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: selected?.type ?? 'manual',
          sourceId: selected?.id ?? null,
          moment: moment.trim(),
          target: target.trim() || null,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        opportunity?: Opportunity;
        error?: string;
      };
      if (!response.ok || !data.opportunity)
        throw new Error(data.error || 'Could not create opportunity.');
      const createdOpportunity = data.opportunity;
      setOpportunities((previous) => [createdOpportunity, ...previous]);
      setMoment('');
      setTarget('');
      setSourceKey('manual');
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Could not create opportunity.',
      );
    } finally {
      setSaving(false);
    }
  }

  function replaceOpportunity(updated: Opportunity) {
    setOpportunities((previous) =>
      previous.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  if (loading) {
    return <DeskNotice>Loading opportunity signals…</DeskNotice>;
  }

  return (
    <div className="space-y-8">
      {error && <DeskNotice tone="error">{error}</DeskNotice>}

      <form
        onSubmit={createOpportunity}
        className="rounded-2xl border border-karte-border bg-white/[0.025] p-5 sm:p-6"
      >
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-karte-accent">
          New signal
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-karte-text-2">
            Start from
            <select
              value={sourceKey}
              onChange={(event) => {
                const value = event.target.value;
                setSourceKey(value);
                const selected = sources.find(
                  (source) => `${source.type}:${source.id}` === value,
                );
                if (selected && !moment.trim()) setMoment(selected.summary);
              }}
              className="mt-2 w-full rounded-xl border border-karte-border-emphasis bg-black/30 px-3 py-2.5 text-karte-text"
            >
              <option value="manual">Manual moment</option>
              {sources.map((source) => (
                <option
                  key={`${source.type}:${source.id}`}
                  value={`${source.type}:${source.id}`}
                >
                  {source.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-karte-text-2">
            Target or brand category (optional)
            <input
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              maxLength={240}
              placeholder="Sustainable travel brands"
              className="mt-2 w-full rounded-xl border border-karte-border-emphasis bg-black/30 px-3 py-2.5 text-karte-text placeholder:text-karte-text-4"
            />
          </label>
        </div>
        <label className="mt-4 block text-sm text-karte-text-2">
          What happened, and why might it matter commercially?
          <textarea
            value={moment}
            onChange={(event) => setMoment(event.target.value)}
            maxLength={1200}
            rows={4}
            required
            className="mt-2 w-full rounded-xl border border-karte-border-emphasis bg-black/30 px-3 py-2.5 text-karte-text placeholder:text-karte-text-4"
            placeholder="A recent post about train travel drew unusually strong questions about my gear…"
          />
        </label>
        <button
          type="submit"
          disabled={saving || !moment.trim()}
          className="mt-4 rounded-lg bg-karte-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Create signal'}
        </button>
      </form>

      {opportunities.length === 0 ? (
        <DeskNotice>
          No opportunity signals yet. Start from a timeline moment or an inbound
          above.
        </DeskNotice>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              pageId={pageId}
              opportunity={opportunity}
              onUpdated={replaceOpportunity}
              onError={setError}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OpportunityCard({
  pageId,
  opportunity,
  onUpdated,
  onError,
}: {
  pageId: string;
  opportunity: Opportunity;
  onUpdated: (value: Opportunity) => void;
  onError: (value: string) => void;
}) {
  const [recipient, setRecipient] = useState(opportunity.recipient ?? '');
  const [verified, setVerified] = useState(opportunity.recipientVerified);
  const [subject, setSubject] = useState(opportunity.draftSubject ?? '');
  const [body, setBody] = useState(opportunity.draftBody ?? '');
  const [angles, setAngles] = useState(
    opportunity.analysis?.partnershipAngles.join('\n') ?? '',
  );
  const [working, setWorking] = useState('');

  async function mutate(payload: Record<string, unknown>) {
    setWorking(String(payload.action ?? 'save'));
    onError('');
    try {
      const response = await fetch(
        `/api/pages/${pageId}/opportunities/${opportunity.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const data = (await response.json().catch(() => ({}))) as {
        opportunity?: Opportunity;
        error?: string;
      };
      if (!response.ok || !data.opportunity)
        throw new Error(data.error || 'Could not update opportunity.');
      onUpdated(data.opportunity);
    } catch (caught) {
      onError(
        caught instanceof Error
          ? caught.message
          : 'Could not update opportunity.',
      );
    } finally {
      setWorking('');
    }
  }

  async function generate() {
    setWorking('generate');
    onError('');
    try {
      const response = await fetch(
        `/api/pages/${pageId}/opportunities/${opportunity.id}/generate`,
        {
          method: 'POST',
        },
      );
      const data = (await response.json().catch(() => ({}))) as {
        opportunity?: Opportunity;
        error?: string;
      };
      if (!response.ok || !data.opportunity)
        throw new Error(data.error || 'Generation failed.');
      const updated = data.opportunity;
      setSubject(updated.draftSubject ?? '');
      setBody(updated.draftBody ?? '');
      setAngles(updated.analysis?.partnershipAngles.join('\n') ?? '');
      onUpdated(updated);
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : 'Generation failed.');
    } finally {
      setWorking('');
    }
  }

  const mailto = buildOpportunityMailto({
    status: opportunity.status,
    recipient,
    recipientVerified: verified,
    subject,
    body,
  });

  return (
    <article className="rounded-2xl border border-karte-border bg-white/[0.025] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={opportunity.status} />
            <span className="text-xs text-karte-text-4">
              {opportunity.sourceSnapshot.label}
            </span>
          </div>
          <h2 className="mt-3 text-xl font-semibold text-karte-text">
            {opportunity.analysis?.title ?? opportunity.moment}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-karte-text-3">
            {opportunity.sourceSnapshot.summary}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generate}
            disabled={Boolean(working)}
            className="rounded-lg bg-karte-accent px-3 py-2 text-sm font-semibold text-black disabled:opacity-40"
          >
            {working === 'generate'
              ? 'Generating…'
              : opportunity.analysis
                ? 'Regenerate'
                : 'Generate'}
          </button>
          {opportunity.status !== 'dismissed' && (
            <button
              onClick={() => mutate({ action: 'dismiss' })}
              disabled={Boolean(working)}
              className="rounded-lg border border-karte-border-emphasis px-3 py-2 text-sm text-karte-text-2"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>

      {opportunity.analysis && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <BriefPanel title="Fit and timing">
            <p>{opportunity.analysis.fitRationale}</p>
            <p className="mt-2 text-karte-text-2">
              Lead time: {opportunity.analysis.leadTime}
            </p>
          </BriefPanel>
          <BriefPanel title="Risks">
            <ul className="list-disc space-y-1 pl-5">
              {opportunity.analysis.riskNotes.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          </BriefPanel>
          <BriefPanel title="Brand hypotheses — verify before use">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-amber-200">
              AI suggestions, not confirmed interest or contact
            </p>
            <p>{opportunity.analysis.brandCategories.join(' · ')}</p>
            {opportunity.analysis.namedBrandHypotheses.length > 0 && (
              <p className="mt-2 text-karte-text-2">
                {opportunity.analysis.namedBrandHypotheses.join(' · ')}
              </p>
            )}
          </BriefPanel>
          <label className="rounded-xl border border-karte-border bg-black/20 p-4 text-sm text-karte-text-3">
            Partnership angles (one per line)
            <textarea
              value={angles}
              onChange={(event) => setAngles(event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-lg border border-karte-border-emphasis bg-black/30 p-3 text-karte-text"
            />
          </label>
        </div>
      )}

      {(opportunity.analysis || opportunity.status === 'approved') && (
        <div className="mt-6 space-y-4 rounded-xl border border-karte-border bg-black/20 p-4">
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <label className="text-sm text-karte-text-2">
              Recipient
              <input
                type="email"
                value={recipient}
                onChange={(event) => {
                  setRecipient(event.target.value);
                  setVerified(false);
                }}
                className="mt-2 w-full rounded-lg border border-karte-border-emphasis bg-black/30 p-3 text-karte-text"
                placeholder="creator-verified@example.com"
              />
            </label>
            <label className="flex items-end gap-2 pb-3 text-sm text-karte-text-2">
              <input
                type="checkbox"
                checked={verified}
                onChange={(event) => setVerified(event.target.checked)}
              />{' '}
              I verified this address
            </label>
          </div>
          <label className="block text-sm text-karte-text-2">
            Subject
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="mt-2 w-full rounded-lg border border-karte-border-emphasis bg-black/30 p-3 text-karte-text"
            />
          </label>
          <label className="block text-sm text-karte-text-2">
            Draft
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={9}
              className="mt-2 w-full rounded-lg border border-karte-border-emphasis bg-black/30 p-3 text-karte-text"
            />
          </label>
          <p className="text-xs text-karte-text-4">
            Karte never sends. Saving material edits resets an approved draft to
            review.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                mutate({
                  recipient,
                  recipientVerified: verified,
                  draftSubject: subject,
                  draftBody: body,
                  partnershipAngles: angles
                    .split('\n')
                    .map((value) => value.trim())
                    .filter(Boolean)
                    .slice(0, 4),
                })
              }
              disabled={Boolean(working)}
              className="rounded-lg border border-karte-border-emphasis px-3 py-2 text-sm text-karte-text"
            >
              Save review
            </button>
            <button
              onClick={() => mutate({ action: 'approve' })}
              disabled={Boolean(working) || !subject.trim() || !body.trim()}
              className="rounded-lg bg-emerald-300 px-3 py-2 text-sm font-semibold text-black disabled:opacity-40"
            >
              Approve
            </button>
            <button
              onClick={() =>
                navigator.clipboard.writeText(`${subject}\n\n${body}`)
              }
              className="rounded-lg border border-karte-border-emphasis px-3 py-2 text-sm text-karte-text"
            >
              Copy
            </button>
            {mailto ? (
              <a
                href={mailto}
                className="rounded-lg border border-karte-accent/50 px-3 py-2 text-sm text-karte-accent"
              >
                Open in mail
              </a>
            ) : (
              <span className="px-2 py-2 text-xs text-karte-text-4">
                Approve and verify a recipient to open mail.
              </span>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function DeskNotice({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'error';
}) {
  return (
    <div
      className={`rounded-2xl border p-5 text-sm ${tone === 'error' ? 'border-red-300/30 bg-red-300/10 text-red-100' : 'border-karte-border bg-white/[0.02] text-karte-text-3'}`}
    >
      {children}
    </div>
  );
}

function BriefPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-karte-border bg-black/20 p-4 text-sm leading-6 text-karte-text-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-karte-text-4">
        {title}
      </p>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: CreatorOpportunityStatus }) {
  const tone =
    status === 'approved'
      ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100'
      : status === 'dismissed'
        ? 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300'
        : status === 'drafted'
          ? 'border-amber-300/30 bg-amber-300/10 text-amber-100'
          : 'border-sky-300/30 bg-sky-300/10 text-sky-100';
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${tone}`}
    >
      {status}
    </span>
  );
}
