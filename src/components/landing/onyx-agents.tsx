'use client';

import posthog from 'posthog-js';
import { useState } from 'react';

function capture(event: string, props?: Record<string, unknown>) {
  try {
    posthog.capture(event, props);
  } catch {
    // best-effort
  }
}

/**
 * Card IV — For the agents, too.
 *
 * Left: pitch + waitlist CTA. Right: Atlas·4 mini sample agent card
 * with blue-foil edge.
 *
 * The CTA opens an inline email input that POSTs to /api/agent-waitlist
 * — agent subtype is on the build queue (4 weeks per docs/plans/agent-
 * subtype-spec.md) so until that ships the honest UX is a waitlist
 * rather than a 404.
 */
type WaitlistState =
  | { kind: 'closed' }
  | { kind: 'open'; email: string; submitting: boolean; message: string; error: boolean };

export function OnyxAgents() {
  const [state, setState] = useState<WaitlistState>({ kind: 'closed' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state.kind !== 'open' || state.submitting) return;

    const email = state.email.trim();
    if (!isValidEmail(email)) {
      setState({ ...state, message: 'That doesn’t look like an email.', error: true });
      return;
    }

    setState({ ...state, submitting: true, message: '', error: false });

    try {
      const res = await fetch('/api/agent-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Could not save — try again.');
      }
      setState({
        kind: 'open',
        email,
        submitting: false,
        message: 'You’re in. We’ll write when agent cards ship.',
        error: false,
      });
      capture('landing_agents_waitlist_submitted', { domain: email.split('@')[1] });
    } catch (err) {
      setState({
        kind: 'open',
        email,
        submitting: false,
        message: err instanceof Error ? err.message : 'Something went wrong.',
        error: true,
      });
      capture('landing_agents_waitlist_failed');
    }
  }

  return (
    <div className="onyx-agents">
      <div className="onyx-agents-left">
        <div className="onyx-eyebrow">·  ISSUED → ANY AGENT  ·</div>
        <h2 className="onyx-h2">
          For the agents,
          <br />
          <em>too.</em>
        </h2>
        <p className="onyx-agents-p">
          Your agent has a rate, a stack, a set of boundaries.
          It should have a card, too. Karte issues one to any agent
          you put on the open web.
        </p>

        {state.kind === 'closed' ? (
          <div className="onyx-agents-actions">
            <button
              type="button"
              className="onyx-btn-primary"
              onClick={() => {
                capture('landing_agents_waitlist_opened');
                setState({
                  kind: 'open',
                  email: '',
                  submitting: false,
                  message: '',
                  error: false,
                });
              }}
            >
              Coming soon — notify me <span aria-hidden="true">→</span>
            </button>
          </div>
        ) : (
          <>
            <form className="onyx-agents-waitlist" onSubmit={handleSubmit}>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@operator.com"
                value={state.email}
                onChange={(e) => setState({ ...state, email: e.target.value, message: '', error: false })}
                disabled={state.submitting}
                required
              />
              <button type="submit" disabled={state.submitting || !state.email.trim()}>
                {state.submitting ? 'Saving…' : 'Notify me'}
              </button>
            </form>
            {state.message ? (
              <p className={`onyx-agents-waitlist-msg ${state.error ? 'error' : ''}`}>
                {state.message}
              </p>
            ) : (
              <p className="onyx-agents-waitlist-msg">
                Agent cards ship soon. Drop an email and we&rsquo;ll write when they&rsquo;re live.
              </p>
            )}
          </>
        )}
      </div>

      <div className="onyx-agents-right">
        <AtlasMiniCard />
      </div>
    </div>
  );
}

function AtlasMiniCard() {
  return (
    <div className="onyx-agent-mini">
      <div className="onyx-agent-mini-foil" aria-hidden="true" />
      <div className="onyx-agent-mini-top">
        <span>AGENT EDITION</span>
        <span>№ a-0042</span>
      </div>
      <div className="onyx-agent-mini-mid">
        <div className="onyx-agent-mini-avatar" aria-hidden="true">○</div>
        <div className="onyx-agent-mini-name">Atlas·4</div>
        <div className="onyx-agent-mini-rule" aria-hidden="true" />
        <div className="onyx-agent-mini-role">
          <em>Coding agent · on call</em>
        </div>
      </div>
      <div className="onyx-agent-spec">
        <div>
          <b>rate</b>
          <span>on request</span>
        </div>
        <div>
          <b>stack</b>
          <span>TS · Rust · Postgres</span>
        </div>
        <div>
          <b>scopes</b>
          <span>read · propose · ship (with review)</span>
        </div>
      </div>
      <div className="onyx-agent-mini-bot">
        <span>karte.cc / atlas</span>
        <span>ISSUED → AGENT</span>
      </div>
    </div>
  );
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
