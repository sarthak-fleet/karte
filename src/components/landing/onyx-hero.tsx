'use client';

import Link from 'next/link';
import posthog from 'posthog-js';

/**
 * Card I — Hero.
 *
 * Carries the brand wordplay: a small italic line under the H1 picks
 * up the etymology + pun ("German for card. This one talks back.").
 */
export function OnyxHero() {
  function captureClick(event: string) {
    try {
      posthog.capture(event);
    } catch {
      // Analytics is best-effort — never block navigation.
    }
  }

  return (
    <div className="onyx-hero">
      <div className="onyx-eyebrow">
        <span className="onyx-eyebrow-dot" aria-hidden="true" />
        The link-in-bio, upgraded
      </div>

      <h1 className="onyx-hero-h1">
        Your link-in-bio,
        <br />
        <em>that answers back.</em>
      </h1>

      <p className="onyx-hero-etymology">
        <span className="gold">karte</span> <span className="gold">·</span>{' '}
        <span className="gold">/ˈkartə/</span> — German for card.{' '}
        <em>This one talks back.</em>
      </p>

      <p className="onyx-hero-sub">
        Same one link. But this one knows what you&rsquo;d say — and handles it
        in your voice, before it hits your inbox.
      </p>

      <div className="onyx-hero-actions">
        <Link
          href="/create"
          className="onyx-btn-primary"
          onClick={() => captureClick('landing_hero_claim_clicked')}
        >
          Claim your name <span aria-hidden="true">→</span>
        </Link>
        <Link
          href="/sarthak"
          className="onyx-btn-ghost"
          onClick={() => captureClick('landing_hero_demo_clicked')}
        >
          See it live <span aria-hidden="true">↗</span>
        </Link>
      </div>

      <div className="onyx-hero-fine">
        Free · no card · 60-second import from Linktree, Beacons, or Bento.
      </div>
    </div>
  );
}
