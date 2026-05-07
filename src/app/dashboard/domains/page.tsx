import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { DomainEditor } from '@/components/dashboard/domain-editor';
import { db, ensureProjectsTable } from '@/db';
import { pageDomains, pages } from '@/db/schema';
import { getSession } from '@/lib/auth-server';
import { getDnsInstructions, isVercelConfigured } from '@/lib/vercel-domains';

export default async function DomainsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  await ensureProjectsTable();

  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, session.user.id),
  });

  if (!page) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold text-white">Domains</h1>
        <p className="text-sm text-gray-400">
          Create a page first from the Appearance tab.
        </p>
      </div>
    );
  }

  const domains = await db
    .select()
    .from(pageDomains)
    .where(eq(pageDomains.pageId, page.id));

  const initial = domains.map((d) => ({
    ...d,
    createdAt: d.createdAt ? d.createdAt.toISOString() : null,
    updatedAt: d.updatedAt ? d.updatedAt.toISOString() : null,
    lastCheckedAt: d.lastCheckedAt ? d.lastCheckedAt.toISOString() : null,
    dnsInstructions: getDnsInstructions(d.hostname),
  }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-white">Custom Domains</h1>
      <p className="mb-6 text-sm text-gray-400">
        Connect a domain you own to your published profile. Slug routes (
        <code className="rounded bg-white/10 px-1">/{page.slug}</code>) keep
        working alongside any custom domain.
      </p>
      {!isVercelConfigured() && (
        <div className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-300/5 p-4 text-xs text-amber-100">
          Vercel domain integration is not configured on this deployment. You
          can still attach a domain — it will stay <code>pending</code> until
          <code className="mx-1">VERCEL_TOKEN</code>+
          <code>VERCEL_PROJECT_ID</code> are set and DNS resolves to the host.
        </div>
      )}
      <DomainEditor pageId={page.id} initial={initial} />
    </div>
  );
}
