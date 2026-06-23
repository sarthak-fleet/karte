import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy — Karte',
  description:
    'What Karte stores, what it sends to third parties, and how to delete your data.',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-sm leading-7 text-karte-text-2">
      <Link href="/" className="text-xs text-karte-text-4 hover:underline">
        ← Karte
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-karte-text">
        Privacy
      </h1>
      <p className="mt-4 text-xs text-karte-text-4">
        Last updated: 2026-05-29.
      </p>

      <p className="mt-6 text-karte-text-3">
        Karte is a personal profile + chat product. Here is exactly what we
        store, what we send to third parties, and how to remove your data. We
        aim to be specific, not legalistic.
      </p>

      <h2 className="mt-8 text-base font-semibold text-karte-text">
        What we store
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-karte-text-4">
        <li>
          Your Google OAuth identity (email, name, profile image URL) for
          sign-in.
        </li>
        <li>
          Profile content you enter: bio, links, projects, info blocks (chat
          memory), timeline events, page sections, theme + accent.
        </li>
        <li>
          Avatar and project images you upload — stored in Cloudflare R2 under
          the karte.cc account.
        </li>
        <li>
          AI-generated content for your profile (encyclopedia, newspaper, roast)
          — cached so repeat visitors don&rsquo;t re-trigger generation.
        </li>
        <li>
          Anonymous visitor identifiers: a first-party cookie (
          <code className="rounded bg-white/[0.06] px-1 text-[12px]">
            lc_vid
          </code>
          , 2-year expiry) and a localStorage mirror, used to attribute page
          views and chat sessions.
        </li>
        <li>
          Visitor chat conversations (transcript, visitor email, timestamps)
          saved against the page they were started on — so the page owner can
          read what people are asking.
        </li>
        <li>
          Email addresses entered into the visitor chat gate or the agent
          waitlist on the landing page.
        </li>
        <li>
          Anonymous analytics events (clicks, scrolls, mode triggers) tagged by
          visitor cookie.
        </li>
      </ul>

      <h2 className="mt-8 text-base font-semibold text-karte-text">
        Third parties we send data to
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-karte-text-4">
        <li>
          <strong className="text-karte-text">Cloudflare</strong> — hosts the
          application (Workers), the database (D1), and uploaded images (R2).
          Cloudflare receives traffic logs by default.
        </li>
        <li>
          <strong className="text-karte-text">Google</strong> — handles sign-in
          via OAuth; receives the standard auth metadata.
        </li>
        <li>
          <strong className="text-karte-text">PostHog</strong>{' '}
          (us.i.posthog.com) — receives anonymous product analytics events (page
          views, button clicks, AI-component renders, errors). We identify by
          visitor cookie, not by name or email.
        </li>
        <li>
          <strong className="text-karte-text">AI inference providers</strong> —
          chat queries, page content sources, and generation prompts are sent to
          the AI gateway (default: a free-ai-gateway service routing to
          Cloudflare Workers AI; optionally to a key the profile owner
          configures). Providers may log requests for abuse prevention; we do
          not share your data with them for training.
        </li>
      </ul>

      <h2 className="mt-8 text-base font-semibold text-karte-text">
        What we don&rsquo;t do
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-karte-text-4">
        <li>We don&rsquo;t sell your data.</li>
        <li>We don&rsquo;t serve third-party ads.</li>
        <li>We don&rsquo;t fingerprint visitors with cross-site trackers.</li>
        <li>
          We don&rsquo;t share visitor chat transcripts with anyone other than
          the page owner.
        </li>
      </ul>

      <h2 className="mt-8 text-base font-semibold text-karte-text">
        Public vs private
      </h2>
      <p className="mt-2">
        Profiles are public by default — your slug, bio, links, projects, and
        timeline are visible to anyone with the URL. You can set a profile
        private from the dashboard; private profiles return 404 to anyone but
        the owner.
      </p>

      <h2 className="mt-8 text-base font-semibold text-karte-text">Deletion</h2>
      <p className="mt-2">
        Delete your profile from the dashboard to remove all stored content —
        page row, links, projects, info blocks, timeline events, generated
        pages, conversations, and R2 avatar/image uploads. Visitor analytics
        events keyed to your slug are retained anonymously for fleet metrics but
        are no longer queryable in any user-facing surface.
      </p>

      <p className="mt-2">
        Email{' '}
        <a href="mailto:sarthak@vaultwealth.com" className="underline">
          sarthak@vaultwealth.com
        </a>{' '}
        if you need help removing data or if anything on this page is
        inaccurate.
      </p>
    </main>
  );
}
