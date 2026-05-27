import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { db, ensureProjectsTable } from '@/db';
import { pageEvents } from '@/db/schema';
import { getCurrentPage, getSession } from '@/lib/auth-server';
import {
  buildVariantPreviewUrl,
  PROFILE_VARIANTS,
  summarizeVariantAnalytics,
} from '@/lib/profile-variants';

function formatPercent(value: number) {
  return `${Math.round(value * 1000) / 10}%`;
}

function VariantMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-white/[0.025] p-4">
      <p className="text-[11px] uppercase tracking-[0.24em] text-karte-text-4">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-karte-text">{value}</p>
    </div>
  );
}

export default async function ExperimentsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  await ensureProjectsTable();

  const page = await getCurrentPage(session.user.id);

  if (!page) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <h1 className="text-2xl font-bold text-karte-text">Experiments</h1>
        <div className="rounded-2xl bg-white/[0.02] p-8 text-center">
          <p className="text-karte-text-3">Create and publish a page before testing variants.</p>
        </div>
      </div>
    );
  }

  const recentEvents = await db
    .select({
      eventType: pageEvents.eventType,
      metadata: pageEvents.metadata,
    })
    .from(pageEvents)
    .where(eq(pageEvents.pageId, page.id))
    .orderBy(desc(pageEvents.createdAt))
    .limit(500);

  const analytics = summarizeVariantAnalytics(recentEvents);
  const analyticsById = new Map(analytics.map((row) => [row.id, row]));
  const totalViews = analytics.reduce((sum, row) => sum + row.views, 0);
  const totalConversions = analytics.reduce((sum, row) => sum + row.conversions, 0);
  const bestVariant = analytics[0];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-karte-text">Profile Experiments</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-karte-text-3">
          Test profile framing with variant links and compare conversion events from the same
          analytics stream.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <VariantMetric label="Tracked views" value={totalViews} />
        <VariantMetric label="Conversions" value={totalConversions} />
        <VariantMetric
          label="Best variant"
          value={bestVariant ? bestVariant.id : 'No data'}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {PROFILE_VARIANTS.map((variant) => {
          const row = analyticsById.get(variant.id) ?? {
            id: variant.id,
            views: 0,
            conversions: 0,
            conversionRate: 0,
          };
          const previewUrl = buildVariantPreviewUrl(page.slug, variant.id);

          return (
            <div
              key={variant.id}
              className="rounded-2xl bg-white/[0.025] p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200">
                    {variant.audience}
                  </p>
                  <h2 className="mt-3 text-xl font-semibold text-karte-text">{variant.label}</h2>
                  <p className="mt-3 text-sm leading-6 text-karte-text-3">{variant.hypothesis}</p>
                </div>
                <Link
                  href={previewUrl}
                  target="_blank"
                  className="shrink-0 rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/15"
                >
                  Preview
                </Link>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <VariantMetric label="Views" value={row.views} />
                <VariantMetric label="Conversions" value={row.conversions} />
                <VariantMetric label="Rate" value={formatPercent(row.conversionRate)} />
              </div>

              <div className="mt-5 rounded-xl bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-karte-text-4">Share URL</p>
                <p className="mt-2 break-all text-sm text-karte-text-2">{previewUrl}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
