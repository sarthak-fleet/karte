'use client';

import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { useState } from 'react';

/**
 * Card V — Final CTA.
 *
 * Username input feeds straight into /create with the slug preselected.
 * No availability check at this stage — keeps the card honest about
 * what it does (claim a name), defers conflict-resolution to the
 * create flow which already handles slug collisions.
 */
export function OnyxCta() {
  const router = useRouter();
  const [slug, setSlug] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = slug.trim();
    try {
      posthog.capture('landing_cta_claim_submitted', { hasSlug: !!trimmed });
    } catch {
      // best-effort
    }
    if (trimmed) {
      router.push(`/create?slug=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/create');
    }
  }

  return (
    <div className="onyx-cta">
      <div className="onyx-eyebrow center">· CLAIM YOUR NAME ·</div>
      <h2 className="onyx-cta-h">
        Build the profile
        <br />
        <em>they talk to.</em>
      </h2>
      <p className="onyx-cta-sub">
        One link. Four surfaces. Conversations that travel. Free forever.
      </p>
      <form className="onyx-cta-form" onSubmit={handleSubmit}>
        <span className="onyx-cta-prefix">karte.cc /</span>
        <input
          className="onyx-cta-input"
          aria-label="Your Karte handle"
          value={slug}
          onChange={(e) =>
            // Mirror the original design: lowercase + strip anything
            // that wouldn't make a valid slug as the user types.
            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
          }
          placeholder="yourname"
          maxLength={40}
        />
        <button type="submit" className="onyx-btn-primary">
          Claim <span aria-hidden="true">→</span>
        </button>
      </form>
      <div className="onyx-cta-fine">Free · no card · 60-second import.</div>
    </div>
  );
}
