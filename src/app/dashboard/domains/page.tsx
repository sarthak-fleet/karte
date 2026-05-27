import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { DomainEditor } from '@/components/dashboard/domain-editor';
import { db, ensureProjectsTable } from '@/db';
import { pageDomains } from '@/db/schema';
import { getCurrentPage, getSession } from '@/lib/auth-server';
import {
  getDnsInstructions,
  isCloudflareCustomHostnamesConfigured,
} from '@/lib/cloudflare-domains';

export default async function DomainsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  await ensureProjectsTable();

  const page = await getCurrentPage(session.user.id);

  if (!page) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold text-karte-text">Domains</h1>
        <p className="text-sm text-karte-text-3">
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
      <h1 className="mb-1 text-2xl font-bold text-karte-text">Custom Domains</h1>
      <p className="mb-6 text-sm text-karte-text-3">
        Connect a domain you own to your published profile. Slug routes (
        <code className="rounded bg-white/10 px-1">/{page.slug}</code>) keep
        working while Cloudflare verifies and routes your custom hostname.
      </p>
      {!isCloudflareCustomHostnamesConfigured() && (
        <div className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-300/5 p-4 text-xs text-amber-100">
          Cloudflare Custom Hostnames are not configured on this deployment. You
          can still attach a domain and copy the DNS instructions; it will stay{' '}
          <code>pending</code> until <code>CLOUDFLARE_API_TOKEN</code> and{' '}
          <code>CLOUDFLARE_ZONE_ID</code> are configured.
        </div>
      )}
      <DomainEditor pageId={page.id} initial={initial} />
    </div>
  );
}
