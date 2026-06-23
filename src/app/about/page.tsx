import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About — Karte',
  description:
    'Karte is a link-in-bio that talks back. Chat, encyclopedia, roast, and newspaper modes powered by AI on top of your profile content.',
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-karte-text-2">
      <Link href="/" className="text-xs text-karte-text-4 hover:underline">
        ← Karte
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-karte-text">
        About
      </h1>
      <p className="mt-4 text-sm leading-6 text-karte-text-3">
        Karte is a link-in-bio with personality. Visitors don&apos;t just see a
        list of URLs — they get to interact with your profile through one of
        four AI-enhanced lenses.
      </p>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-xs font-medium uppercase tracking-wide text-karte-text-4">
          The four modes
        </h2>
        <ul className="list-disc space-y-1 pl-5 marker:text-karte-text-4">
          <li>
            <strong>Chat</strong> — visitors ask questions and your profile
            answers using the content you&apos;ve put into it.
          </li>
          <li>
            <strong>Encyclopedia</strong> — Wikipedia-style page generated from
            your bio + links.
          </li>
          <li>
            <strong>Roast</strong> — playful satirical write-up. For people who
            don&apos;t take their bio too seriously.
          </li>
          <li>
            <strong>Newspaper</strong> — front-page treatment of you and your
            work.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-xs font-medium uppercase tracking-wide text-karte-text-4">
          Privacy
        </h2>
        <p className="text-karte-text-3">
          Profiles are public unless you flip the visibility toggle on
          /dashboard. Visitor chat queries are validated server-side (length,
          shape, type) and not stored unless your profile explicitly opts into
          analytics.
        </p>
      </section>
    </main>
  );
}
