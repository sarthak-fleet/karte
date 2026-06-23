'use client';

import Link from 'next/link';
import posthog from 'posthog-js';

// Sample profiles built from public info. The user explicitly called
// out (2026-05-28) that these weren't surfaced on the new deck — so
// this card sits between FOR THE AGENTS and the final CTA, giving
// visitors a "see it on a real profile before you commit" beat.

const SAMPLES: ReadonlyArray<{ slug: string; label: string; flavor: string }> =
  [
    {
      slug: 'naval',
      label: 'Naval',
      flavor: 'On wealth, leverage, long-term games.',
    },
    {
      slug: 'levelsio',
      label: 'levelsio',
      flavor: 'Solo builder. Public MRR. Lisbon-based.',
    },
    { slug: 'pg', label: 'Paul Graham', flavor: 'YC. Essays. Default-alive.' },
    {
      slug: 'karpathy',
      label: 'Karpathy',
      flavor: 'Back at OpenAI. Eureka Labs.',
    },
  ];

function captureSampleClick(slug: string) {
  try {
    posthog.capture('landing_samples_clicked', { slug });
  } catch {
    // best-effort
  }
}

export function OnyxSamples() {
  return (
    <div className="onyx-samples">
      <div className="onyx-eyebrow center">· THE MEMBERS ·</div>
      <h2 className="onyx-h2 center">
        See it on a <em>real profile.</em>
      </h2>
      <p className="onyx-samples-sub">
        Four sample cards built from public writing. Open one and talk to it —
        ask what they charge, where they live, what stack they use.
      </p>

      <ul className="onyx-samples-list">
        {SAMPLES.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/${s.slug}`}
              onClick={() => captureSampleClick(s.slug)}
              className="onyx-samples-link"
            >
              <span className="onyx-samples-name">{s.label}</span>
              <span className="onyx-samples-flavor">{s.flavor}</span>
              <span className="onyx-samples-arrow" aria-hidden="true">
                karte.cc / {s.slug} →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
