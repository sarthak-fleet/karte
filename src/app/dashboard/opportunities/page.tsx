import { redirect } from 'next/navigation';

import { OpportunityDesk } from '@/components/dashboard/opportunity-desk';
import { getCurrentPage, getSession } from '@/lib/auth-server';

export default async function OpportunitiesPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login?next=/dashboard/opportunities');
  const page = await getCurrentPage(session.user.id);

  if (!page) {
    return (
      <p className="text-sm text-karte-text-3">
        Create your Karte page before opening Opportunity Desk.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-4">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-karte-accent">
          ◆ Opportunity Desk
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-karte-text">
          Turn owned signals into reviewable partnership drafts
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-karte-text-3">
          Start from your timeline or inbound activity, generate only when you
          ask, and approve every word yourself. Named brands are unverified AI
          suggestions. Karte never sends.
        </p>
      </header>
      <OpportunityDesk pageId={page.id} />
    </div>
  );
}
