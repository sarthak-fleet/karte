import './landing.css';

import type { Metadata } from 'next';

import { OnyxAgents } from '@/components/landing/onyx-agents';
import { OnyxCard } from '@/components/landing/onyx-card';
import { OnyxCta } from '@/components/landing/onyx-cta';
import { OnyxHero } from '@/components/landing/onyx-hero';
import { OnyxHow } from '@/components/landing/onyx-how';
import { OnyxSurfaces } from '@/components/landing/onyx-surfaces';

const OG_LANDING = '/api/og/landing';

export const metadata: Metadata = {
  title: 'Karte — Your link-in-bio, that answers back',
  description:
    'A single page for every link you carry. Karte is your digital calling card — and an AI that knows what you would say. German for card. This one talks back.',
  openGraph: {
    title: 'Karte — Your link-in-bio, that answers back',
    description:
      'A digital calling card with four AI surfaces: chat, encyclopedia, newspaper, roast. German for card. This one talks back.',
    url: 'https://karte.cc',
    siteName: 'Karte',
    images: [{ url: OG_LANDING, width: 1200, height: 630, alt: 'Karte — Your link-in-bio, that answers back' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Karte — Your link-in-bio, that answers back',
    description:
      'A digital calling card with four AI surfaces. German for card. This one talks back.',
    images: [OG_LANDING],
  },
};

/**
 * Karte landing — Onyx deck.
 *
 * Five cards, deck-numbered. Each card is an OnyxCard frame around a
 * body component. The deck IS the page — no above-deck nav decoration,
 * no below-deck proof sections; everything the visitor needs to buy
 * the pitch lives inside these five surfaces.
 *
 * Ported from Claude Design handoff bundle (variations/onyx.jsx +
 * onyx-mobile.jsx). See docs/plans/agent-subtype-spec.md for what
 * card IV's CTA pipes into.
 */
export default function Home() {
  return (
    <main>
      {/* Top nav intentionally omitted on the landing page — the deck
          is self-contained and the nav was competing with card I's
          own header strip. CTAs inside cards I + V cover login/create. */}
      <div className="onyx-deck">
        <OnyxCard
          idx="i"
          serial="№ 00471"
          kicker="DIGITAL CARD · CARD V2026"
          footL="karte.cc/yourhandle"
          footR="Free · 60-second import"
        >
          <OnyxHero />
        </OnyxCard>

        <OnyxCard
          idx="ii"
          serial="№ 00472"
          kicker="HOW IT WORKS · CARD II"
          footL="Three steps · one afternoon"
          footR="Scroll for next →"
        >
          <OnyxHow />
        </OnyxCard>

        <OnyxCard
          idx="iii"
          serial="№ 00473"
          kicker="THE FLIP · CARD III"
          footL="One memory · four living surfaces"
          footR="Same sources"
        >
          <OnyxSurfaces />
        </OnyxCard>

        <OnyxCard
          idx="iv"
          serial="№ 00474"
          kicker="FOR THE AGENTS · CARD IV"
          footL="Issued to humans · & to their agents"
          footR="karte.cc/agents"
        >
          <OnyxAgents />
        </OnyxCard>

        <OnyxCard
          idx="v"
          serial="№ 00475"
          kicker="CLAIM YOUR NAME · LAST CARD"
          footL="One link · four surfaces · free forever"
          footR="© MMXXVI · Karte"
        >
          <OnyxCta />
        </OnyxCard>
      </div>
    </main>
  );
}
