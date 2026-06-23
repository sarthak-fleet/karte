'use client';

import Link from 'next/link';
import posthog from 'posthog-js';
import { useState } from 'react';

function capture(event: string, props?: Record<string, unknown>) {
  try {
    posthog.capture(event, props);
  } catch {
    // best-effort
  }
}

type AgentAuthState =
  | { step: 'idle' }
  | {
      step: 'email';
      email: string;
      submitting: boolean;
      message: string;
      error: boolean;
    }
  | {
      step: 'code';
      email: string;
      code: string;
      submitting: boolean;
      message: string;
      error: boolean;
    }
  | { step: 'done'; email: string; apiKey: string; docsUrl: string };

/**
 * Card IV — For the agents, too.
 *
 * Operator email sign-in → API key → agent API docs.
 */
export function OnyxAgents() {
  const [state, setState] = useState<AgentAuthState>({ step: 'idle' });

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    if (state.step !== 'email' || state.submitting) return;

    const email = state.email.trim();
    if (!isValidEmail(email)) {
      setState({
        ...state,
        message: 'That doesn’t look like an email.',
        error: true,
      });
      return;
    }

    setState({ ...state, submitting: true, message: '', error: false });

    try {
      const res = await fetch('/api/auth/agent/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Could not send code.');
      }

      capture('landing_agents_code_requested', { domain: email.split('@')[1] });
      setState({
        step: 'code',
        email,
        code: '',
        submitting: false,
        message: 'Check your email for a 6-digit code.',
        error: false,
      });
    } catch (err) {
      setState({
        ...state,
        submitting: false,
        message: err instanceof Error ? err.message : 'Something went wrong.',
        error: true,
      });
      capture('landing_agents_code_request_failed');
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (state.step !== 'code' || state.submitting) return;

    const code = state.code.trim();
    if (!/^\d{6}$/.test(code)) {
      setState({
        ...state,
        message: 'Enter the 6-digit code from your email.',
        error: true,
      });
      return;
    }

    setState({ ...state, submitting: true, message: '', error: false });

    try {
      const res = await fetch('/api/auth/agent/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.email, code, keyName: 'landing' }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        apiKey?: string;
        docs_url?: string;
        message?: string;
      };
      if (!res.ok || !data.apiKey) {
        throw new Error(data.error || data.message || 'Invalid code.');
      }

      capture('landing_agents_api_key_issued');
      setState({
        step: 'done',
        email: state.email,
        apiKey: data.apiKey,
        docsUrl: data.docs_url || '/skill.md',
      });
    } catch (err) {
      setState({
        ...state,
        submitting: false,
        message: err instanceof Error ? err.message : 'Something went wrong.',
        error: true,
      });
      capture('landing_agents_verify_failed');
    }
  }

  return (
    <div className="onyx-agents">
      <div className="onyx-agents-left">
        <div className="onyx-eyebrow">· ISSUED → ANY AGENT ·</div>
        <h2 className="onyx-h2">
          For the agents,
          <br />
          <em>too.</em>
        </h2>
        <p className="onyx-agents-p">
          Your agent has a rate, a stack, a set of boundaries. It should have a
          card, too. Karte issues one to any agent you put on the open web.
        </p>

        {state.step === 'idle' ? (
          <div className="onyx-agents-actions">
            <button
              type="button"
              className="onyx-btn-primary"
              onClick={() => {
                capture('landing_agents_auth_opened');
                setState({
                  step: 'email',
                  email: '',
                  submitting: false,
                  message: '',
                  error: false,
                });
              }}
            >
              Get agent API key <span aria-hidden="true">→</span>
            </button>
            <a className="onyx-agents-docs-link" href="/skill.md">
              Read agent skill
            </a>
            <code className="onyx-agents-install">
              curl -fsSL karte.cc/skills/karte/install.sh | bash
            </code>
          </div>
        ) : null}

        {state.step === 'email' ? (
          <>
            <form className="onyx-agents-waitlist" onSubmit={requestCode}>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@operator.com"
                value={state.email}
                onChange={(e) =>
                  setState({
                    ...state,
                    email: e.target.value,
                    message: '',
                    error: false,
                  })
                }
                disabled={state.submitting}
                required
              />
              <button
                type="submit"
                disabled={state.submitting || !state.email.trim()}
              >
                {state.submitting ? 'Sending…' : 'Send code'}
              </button>
            </form>
            {state.message ? (
              <p
                className={`onyx-agents-waitlist-msg ${state.error ? 'error' : ''}`}
              >
                {state.message}
              </p>
            ) : (
              <p className="onyx-agents-waitlist-msg">
                Operator email only. We&apos;ll send a 6-digit sign-in code.
              </p>
            )}
          </>
        ) : null}

        {state.step === 'code' ? (
          <>
            <form className="onyx-agents-waitlist" onSubmit={verifyCode}>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                value={state.code}
                onChange={(e) =>
                  setState({
                    ...state,
                    code: e.target.value,
                    message: '',
                    error: false,
                  })
                }
                disabled={state.submitting}
                required
              />
              <button
                type="submit"
                disabled={state.submitting || state.code.trim().length < 6}
              >
                {state.submitting ? 'Verifying…' : 'Verify'}
              </button>
            </form>
            {state.message ? (
              <p
                className={`onyx-agents-waitlist-msg ${state.error ? 'error' : ''}`}
              >
                {state.message}
              </p>
            ) : null}
          </>
        ) : null}

        {state.step === 'done' ? (
          <div className="onyx-agents-success">
            <p className="onyx-agents-waitlist-msg">
              API key issued for <strong>{state.email}</strong>. Save it now —
              it won&apos;t be shown again.
            </p>
            <code className="onyx-agents-key">{state.apiKey}</code>
            <div className="onyx-agents-actions">
              <a className="onyx-btn-primary" href={state.docsUrl}>
                Open agent skill <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        ) : null}
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
        <div className="onyx-agent-mini-avatar" aria-hidden="true">
          ○
        </div>
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
        <Link href="/atlas-demo" className="onyx-agent-mini-link">
          karte.cc / atlas-demo
        </Link>
        <span>ISSUED → AGENT</span>
      </div>
    </div>
  );
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
