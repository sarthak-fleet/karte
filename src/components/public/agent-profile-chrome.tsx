import Link from 'next/link';

import type { AgentPageFields } from '@/lib/agent-profiles';
import { agentCapabilities, isAgentVerified } from '@/lib/agent-profiles';

export function AgentProfileBanner({
  page,
  slug,
}: {
  page: AgentPageFields;
  slug: string;
}) {
  const verified = isAgentVerified(page);
  const operator = page.agentOperator?.trim();
  const operatorUrl = page.agentOperatorUrl?.trim();

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-2.5 text-[12px] text-cyan-100/90">
        <span>
          <span className="font-semibold text-cyan-100">
            AI agent trust card.
          </span>{' '}
          You are viewing a machine-operated agent registry entry, not a human
          profile.
        </span>
        <Link
          href={`/${slug}/agent.json`}
          className="rounded-full bg-cyan-200/10 px-3 py-1 text-[11.5px] font-medium text-cyan-50 transition hover:bg-cyan-200/20"
        >
          View manifest →
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-karte-text-3">
          Issued → Agent
        </span>
        {verified ? (
          <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
            Verified by {page.verifiedDomain}
          </span>
        ) : (
          <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-[11px] font-medium text-amber-200">
            Unverified — operator has not confirmed domain control
          </span>
        )}
        {operator ? (
          <span className="text-[12px] text-karte-text-3">
            Operated by{' '}
            {operatorUrl ? (
              <a
                href={operatorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-karte-text-2 underline decoration-white/20 underline-offset-2 hover:text-karte-text"
              >
                {operator}
              </a>
            ) : (
              <span className="font-medium text-karte-text-2">{operator}</span>
            )}
          </span>
        ) : null}
      </div>

      {page.agentDisclosurePolicy?.trim() ? (
        <p className="text-[12px] leading-relaxed text-karte-text-4">
          {page.agentDisclosurePolicy.trim()}
        </p>
      ) : null}
    </div>
  );
}

export function AgentCapabilitiesSection({
  page,
  accentColor,
}: {
  page: AgentPageFields;
  accentColor: string;
}) {
  const capabilities = agentCapabilities(page);
  if (capabilities.length === 0) return null;

  return (
    <section>
      <div className="mb-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
          <span style={{ color: accentColor }}>·</span> Capabilities
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.015em] text-karte-text sm:text-[28px]">
          What this agent can do
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {capabilities.map((capability) => (
          <div
            key={capability.id}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-4"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-karte-text-4">
              {capability.label || capability.id}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-karte-text-2">
              {capability.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
