'use client';

import { type FormEvent,useState } from 'react';

import type { DmMode } from '@/db/schema';
import { authClient } from '@/lib/auth-client';
import { getOrCreateVisitorId } from '@/lib/visitor-id';

type ContactFormSectionProps = {
  slug: string;
  accentColor?: string;
  compact?: boolean;
  sectionId?: string;
  dmMode?: Exclude<DmMode, 'off'>;
  requireVerifiedEmail?: boolean;
};

export function ContactFormSection({
  slug,
  accentColor = '#2563eb',
  compact = false,
  sectionId,
  dmMode = 'email',
  requireVerifiedEmail = false,
}: ContactFormSectionProps) {
  const { data: session, isPending } = authClient.useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();
    const isAnonymous = dmMode === 'anonymous';
    const usesVerifiedEmail = requireVerifiedEmail && dmMode === 'email';

    if (
      (!isAnonymous && !usesVerifiedEmail && (!trimmedName || !trimmedEmail))
      || (usesVerifiedEmail && !session?.user?.email)
      || !trimmedMessage
      || loading
    ) {
      return;
    }

    setLoading(true);
    setStatus('idle');
    setFeedback('');

    try {
      const res = await fetch(`/api/contact/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: isAnonymous
            ? 'Anonymous'
            : usesVerifiedEmail
              ? session?.user?.name ?? trimmedName
              : trimmedName,
          email: isAnonymous
            ? ''
            : usesVerifiedEmail
              ? session?.user?.email ?? trimmedEmail
              : trimmedEmail,
          message: trimmedMessage,
          visitorId: getOrCreateVisitorId(),
          sectionId,
          senderType: isAnonymous ? 'anonymous' : 'email',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send message');
      }

      setName('');
      setEmail('');
      setMessage('');
      setStatus('success');
      setFeedback('Message sent. You should hear back soon.');
    } catch (error) {
      setStatus('error');
      setFeedback(error instanceof Error ? error.message : 'Failed to send message');
  } finally {
      setLoading(false);
    }
  }

  const needsVerifiedSession =
    requireVerifiedEmail && dmMode === 'email' && !session?.user?.email;
  const verifiedIdentity =
    requireVerifiedEmail && dmMode === 'email' && session?.user?.email
      ? session.user.email
      : null;

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? 'space-y-3' : 'space-y-4'}
    >
      {needsVerifiedSession ? (
        <div className="rounded-xl border border-karte-border-strong bg-white/[0.04] p-4">
          <p className="text-sm font-medium text-karte-text">Verify your email</p>
          <p className="mt-1 text-xs leading-5 text-white/55">
            Sign in with Google so the profile owner can see your verified
            sender identity before you message them.
          </p>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              const callbackURL =
                typeof window === 'undefined' ? '/' : window.location.pathname;
              void authClient.signIn.social({ provider: 'google', callbackURL });
            }}
            className="mt-3 w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-100 disabled:opacity-50"
          >
            {isPending ? 'Checking...' : 'Verify email to send'}
          </button>
        </div>
      ) : dmMode === 'email' && !requireVerifiedEmail ? (
        <>
          <div>
            <label className="mb-1 block text-xs font-medium text-white/70">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-karte-border-strong bg-white/5 px-3 py-2 text-sm text-karte-text placeholder-white/40 outline-none focus:border-white/30"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-white/70">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-karte-border-strong bg-white/5 px-3 py-2 text-sm text-karte-text placeholder-white/40 outline-none focus:border-white/30"
              required
            />
          </div>
        </>
      ) : null}

      {!needsVerifiedSession && (
        <>
          {verifiedIdentity && (
            <p className="rounded-lg border border-green-400/15 bg-green-400/10 px-3 py-2 text-xs leading-5 text-green-200">
              The owner will see your verified email: {verifiedIdentity}
            </p>
          )}

          {dmMode === 'anonymous' && (
            <p className="rounded-lg border border-karte-border-strong bg-white/[0.04] px-3 py-2 text-xs leading-5 text-white/55">
              No name or email will be attached to this message.
            </p>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-white/70">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What would you like to talk about?"
              rows={compact ? 4 : 5}
              className="w-full rounded-lg border border-karte-border-strong bg-white/5 px-3 py-2 text-sm text-karte-text placeholder-white/40 outline-none focus:border-white/30"
              required
            />
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={loading || needsVerifiedSession}
        className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm font-semibold text-[#17120a] shadow-[0_12px_34px_-28px_rgba(242,200,121,0.9)] transition hover:brightness-110 disabled:opacity-50"
        style={{ backgroundColor: accentColor }}
      >
        {loading ? 'Sending...' : 'Send Message'}
      </button>

      {status !== 'idle' && feedback && (
        <p
          className={`text-xs ${
            status === 'success' ? 'text-emerald-300' : 'text-red-300'
          }`}
        >
          {feedback}
        </p>
      )}
    </form>
  );
}
