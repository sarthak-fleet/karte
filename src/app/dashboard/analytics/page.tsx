import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { db, ensureProjectsTable } from '@/db';
import { dailyResourceStats, dailyStats, dailyVisitorEvents, pageEvents } from '@/db/schema';
import { getCurrentPage, getSession } from '@/lib/auth-server';

function formatNumber(value: number | string | null) {
  const num = typeof value === 'string' ? Number.parseInt(value, 10) : (value as number);
  return new Intl.NumberFormat('en-US').format(num || 0);
}

function relativeTime(value: Date | string | null) {
  if (!value) return 'just now';
  const date = typeof value === 'string' ? new Date(value) : value;
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diff / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.025] p-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.01em] tabular-nums text-karte-text">
        {value}
      </p>
      {helper && <p className="mt-2 text-[13px] leading-[1.5] text-karte-text-3">{helper}</p>}
    </div>
  );
}

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  // Session + page are inherently chained (page query needs session.user.id).
  // ensureProjectsTable is cached so calling it cheap.
  const [, page] = await Promise.all([
    ensureProjectsTable(),
    getCurrentPage(session.user.id),
  ]);

  if (!page) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <h1 className="text-2xl font-bold tracking-[-0.015em] text-karte-text">Analytics</h1>
        <div className="rounded-2xl bg-white/[0.02] p-8 text-center">
          <p className="text-karte-text-3">Create a page first to start collecting analytics.</p>
        </div>
      </div>
    );
  }

  // All 7 downstream queries only depend on page.id — parallelize.
  // Previous serial chain took ~7 round-trips. This is now 1 RTT.
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dateLimit = sevenDaysAgo.toISOString().split('T')[0];

  const [
    totals,
    resourceTotals,
    visitorRows,
    dailyAggs,
    dailyResourceAggs,
    topDestinations,
    topSections,
    recentEvents,
  ] = await Promise.all([
    db
      .select({
        eventType: dailyStats.eventType,
        count: sql<number>`SUM(${dailyStats.count})`,
      })
      .from(dailyStats)
      .where(eq(dailyStats.pageId, page.id))
      .groupBy(dailyStats.eventType),

    db
      .select({
        eventType: dailyResourceStats.eventType,
        count: sql<number>`SUM(${dailyResourceStats.count})`,
      })
      .from(dailyResourceStats)
      .where(eq(dailyResourceStats.pageId, page.id))
      .groupBy(dailyResourceStats.eventType),

    db
      .select({ count: sql<number>`COUNT(DISTINCT ${dailyVisitorEvents.visitorId})` })
      .from(dailyVisitorEvents)
      .where(eq(dailyVisitorEvents.pageId, page.id)),

    db
      .select({
        date: dailyStats.date,
        eventType: dailyStats.eventType,
        count: dailyStats.count,
      })
      .from(dailyStats)
      .where(and(eq(dailyStats.pageId, page.id), gte(dailyStats.date, dateLimit))),

    db
      .select({
        date: dailyResourceStats.date,
        eventType: dailyResourceStats.eventType,
        count: dailyResourceStats.count,
      })
      .from(dailyResourceStats)
      .where(and(eq(dailyResourceStats.pageId, page.id), gte(dailyResourceStats.date, dateLimit))),

    db
      .select({
        label: dailyResourceStats.resourceLabel,
        resourceType: dailyResourceStats.resourceType,
        clicks: sql<number>`SUM(${dailyResourceStats.count})`,
      })
      .from(dailyResourceStats)
      .where(and(eq(dailyResourceStats.pageId, page.id), eq(dailyResourceStats.eventType, 'outbound_click')))
      .groupBy(dailyResourceStats.resourceId)
      .orderBy(desc(sql`SUM(${dailyResourceStats.count})`))
      .limit(5),

    db
      .select({
        label: dailyResourceStats.resourceLabel,
        resourceType: dailyResourceStats.resourceType,
        views: sql<number>`SUM(${dailyResourceStats.count})`,
      })
      .from(dailyResourceStats)
      .where(and(eq(dailyResourceStats.pageId, page.id), eq(dailyResourceStats.eventType, 'section_view')))
      .groupBy(dailyResourceStats.resourceId)
      .orderBy(desc(sql`SUM(${dailyResourceStats.count})`))
      .limit(5),

    db
      .select()
      .from(pageEvents)
      .where(eq(pageEvents.pageId, page.id))
      .orderBy(desc(pageEvents.createdAt))
      .limit(8),
  ]);

  const getCount = (type: string, source: { eventType: string; count: number }[]) =>
    source.find((s) => s.eventType === type)?.count || 0;

  const pageViews = getCount('page_view', totals);
  const hookOpens = getCount('hook_open', totals);
  const dmConversions = getCount('dm_conversion', totals);
  const outboundClicks = getCount('outbound_click', resourceTotals);
  const chatClicks = getCount('chat_cta_click', resourceTotals);
  const uniqueVisitors = visitorRows[0]?.count || 0;

  const dailyMap = new Map<string, { views: number; sectionViews: number; clicks: number }>();
  for (const row of dailyAggs) {
    const bucket = dailyMap.get(row.date) || { views: 0, sectionViews: 0, clicks: 0 };
    if (row.eventType === 'page_view') bucket.views += row.count;
    dailyMap.set(row.date, bucket);
  }
  for (const row of dailyResourceAggs) {
    const bucket = dailyMap.get(row.date) || { views: 0, sectionViews: 0, clicks: 0 };
    if (row.eventType === 'section_view') bucket.sectionViews += row.count;
    if (row.eventType === 'outbound_click') bucket.clicks += row.count;
    dailyMap.set(row.date, bucket);
  }

  const dailyRows = [...dailyMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-[-0.015em] text-karte-text">Analytics</h1>
        <span className="rounded-full border border-karte-accent/30 bg-karte-accent/[0.08] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.22em] text-karte-accent-soft">
          Beta
        </span>
      </div>
      <p className="text-[14px] leading-[1.55] text-karte-text-3">
        Durable aggregates for views, clicks, and chat interactions.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Page views" value={formatNumber(pageViews)} helper="Total historical views" />
        <MetricCard label="Unique visitors" value={formatNumber(uniqueVisitors)} helper="Across all time" />
        <MetricCard label="Outbound clicks" value={formatNumber(outboundClicks)} helper="Link and project clicks" />
        <MetricCard label="Chat / Hook" value={formatNumber(chatClicks + hookOpens)} helper="CTA clicks and widget opens" />
        <MetricCard label="DM Leads" value={formatNumber(dmConversions)} helper="Messages via DM widget" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl bg-white/[0.025] p-5">
          <h2 className="text-[15px] font-semibold tracking-[-0.005em] text-karte-text">
            Recent activity
          </h2>
          <div className="mt-4 space-y-2.5">
            {recentEvents.length === 0 ? (
              <p className="text-[13px] text-karte-text-4">No events yet.</p>
            ) : (
              recentEvents.map((event) => (
                <div key={event.id} className="rounded-xl bg-karte-bg/40 p-3.5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-karte-text">
                        {event.eventType === 'page_view'
                          ? 'Page viewed'
                          : event.eventType === 'section_view'
                            ? 'Section viewed'
                            : event.eventType === 'contact_submit'
                              ? 'Lead captured'
                              : event.eventType === 'hook_open'
                                ? 'Chat widget opened'
                                : event.eventType === 'chat_cta_click'
                                  ? 'Chat CTA clicked'
                                  : 'Outbound click'}
                      </p>
                      <p className="mt-1 truncate text-[12px] text-karte-text-3">
                        {event.resourceLabel || event.resourceId || 'Public page'}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] tabular-nums text-karte-text-4">
                      {relativeTime(event.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.025] p-5">
          <h2 className="text-[15px] font-semibold tracking-[-0.005em] text-karte-text">
            Top destinations
          </h2>
          <div className="mt-4 space-y-2.5">
            {topDestinations.length === 0 ? (
              <p className="text-[13px] text-karte-text-4">No outbound clicks yet.</p>
            ) : (
              topDestinations.map((item, idx) => (
                <div key={idx} className="rounded-xl bg-karte-bg/40 p-3.5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-karte-text">
                        {item.label || 'Unknown'}
                      </p>
                      <p className="mt-1 text-[11px] text-karte-text-4">
                        {item.resourceType ?? 'outbound'}
                      </p>
                    </div>
                    <span className="rounded-full border border-karte-border bg-white/[0.04] px-2.5 py-0.5 text-[12px] font-medium tabular-nums text-karte-text-2">
                      {item.clicks}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.025] p-5">
          <h2 className="text-[15px] font-semibold tracking-[-0.005em] text-karte-text">
            Top sections
          </h2>
          <div className="mt-4 space-y-2.5">
            {topSections.length === 0 ? (
              <p className="text-[13px] text-karte-text-4">No section views yet.</p>
            ) : (
              topSections.map((item, idx) => (
                <div key={idx} className="rounded-xl bg-karte-bg/40 p-3.5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-karte-text">
                        {item.label || 'Untitled'}
                      </p>
                      <p className="mt-1 text-[11px] text-karte-text-4">
                        {item.resourceType ?? 'section'}
                      </p>
                    </div>
                    <span className="rounded-full border border-karte-border bg-white/[0.04] px-2.5 py-0.5 text-[12px] font-medium tabular-nums text-karte-text-2">
                      {item.views}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white/[0.025] p-5">
        <h2 className="text-[15px] font-semibold tracking-[-0.005em] text-karte-text">
          Last 7 days
        </h2>
        <div className="mt-4 space-y-2.5">
          {dailyRows.length === 0 ? (
            <p className="text-[13px] text-karte-text-4">No data yet.</p>
          ) : (
            dailyRows.map(([day, metrics]) => (
              <div
                key={day}
                className="rounded-xl bg-karte-bg/40 p-3.5 sm:grid sm:grid-cols-[120px_1fr_90px_90px_80px] sm:items-center sm:gap-3 sm:bg-transparent sm:p-0"
              >
                <p className="text-[13px] tabular-nums text-karte-text-3">{day}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06] sm:mt-0">
                  <div
                    className="h-full rounded-full bg-karte-accent"
                    style={{ width: `${Math.min(100, metrics.views * 20)}%` }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-[12px] tabular-nums text-karte-text-2 sm:contents sm:text-[13px]">
                  <p className="text-left sm:text-right">{metrics.views} views</p>
                  <p className="text-left sm:text-right">{metrics.sectionViews} section</p>
                  <p className="text-left sm:text-right">{metrics.clicks} clicks</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
