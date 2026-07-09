'use client';

import Link from 'next/link';
import posthog from 'posthog-js';

/**
 * Card I — Hero.
 *
 * Carries the brand wordplay while positioning Karte as an inbound
 * assistant, not another generic page builder.
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
        The public agent for your inbound
      </div>

      <h1 className="onyx-hero-h1">
        Everyone gets
        <br />
        <em>an agent.</em>
      </h1>

      <p className="onyx-hero-etymology">
        <span className="gold">karte</span> <span className="gold">·</span>{' '}
        <span className="gold">/ˈkartə/</span> — German for card.{' '}
        <em>This one handles inbound.</em>
      </p>

      <p className="onyx-hero-sub">
        Movie stars have agents to filter calls, questions, and opportunities.
        Karte gives that first-pass assistant to every public page: answers,
        context, and cleaner handoffs before anything hits your inbox.
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
        Free · no card · 60-second import from Linktree, Carrd, Beacons, or
        Bento.
      </div>
    </div>
  );
}
