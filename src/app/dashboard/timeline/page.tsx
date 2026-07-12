import Link from 'next/link';
import { redirect } from 'next/navigation';

import { TimelineEditor } from '@/components/dashboard/timeline-editor';
import { getCurrentPage, getSession } from '@/lib/auth-server';

export default async function TimelinePage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login?next=/dashboard/timeline');

  const page = await getCurrentPage(session.user.id);
  if (!page) {
    return (
      <div className="mx-auto max-w-3xl px-2 py-12 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
          ◆ Timeline
        </p>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.015em] text-karte-text">
          Create your profile first
        </h1>
        <p className="mt-3 text-[14px] leading-[1.6] text-karte-text-3">
          Timeline events attach to your Karte page. Set up your page on the
          Appearance tab, then come back here.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-2 py-8 sm:py-10">
      <header className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-accent">
          ◆ Timeline
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-karte-text">
          Your dated history
        </h1>
        <p className="mt-3 max-w-xl text-[14.5px] leading-[1.6] text-karte-text-3">
          Career milestones, shipped projects, talks, life events. Each entry
          shows on your public profile in reverse-chronological order AND feeds
          the AI surfaces (chat, encyclopedia, newspaper, roast) with dated
          context they would otherwise have to guess.
        </p>
        <Link
          href="/dashboard/opportunities"
          className="mt-4 inline-flex rounded-lg border border-karte-accent/35 px-3 py-2 text-sm text-karte-accent"
        >
          Turn a timeline moment into an opportunity
        </Link>
      </header>

      <TimelineEditor pageId={page.id} />
    </div>
  );
}
