import { desc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { db, ensureProjectsTable } from '@/db';
import { pageEvents, pages } from '@/db/schema';
import { getSession } from '@/lib/auth-server';

type NativeAnalyticsEvent = {
  id: string;
  eventType: string;
  resourceType: string | null;
  resourceId: string | null;
  resourceLabel: string | null;
  visitorId: string | null;
  createdAt: Date | string | null;
  metadata: Record<string, unknown> | null;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
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
    <div className="rounded-2xl border border-white/20 bg-white/5 p-5 backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.24em] text-gray-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      {helper && <p className="mt-2 text-sm text-gray-400">{helper}</p>}
    </div>
  );
}

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, session.user.id),
  });

  if (page) {
    await ensureProjectsTable();
  }

  const events: NativeAnalyticsEvent[] = page
    ? await db
        .select({
          id: pageEvents.id,
          eventType: pageEvents.eventType,
          resourceType: pageEvents.resourceType,
          resourceId: pageEvents.resourceId,
          resourceLabel: pageEvents.resourceLabel,
          visitorId: pageEvents.visitorId,
          createdAt: pageEvents.createdAt,
          metadata: pageEvents.metadata,
        })
        .from(pageEvents)
        .where(eq(pageEvents.pageId, page.id))
        .orderBy(desc(pageEvents.createdAt))
    : [];

  const pageViews = events.filter((event) => event.eventType === 'page_view').length;
  const sectionViews = events.filter((event) => event.eventType === 'section_view').length;
  const outboundClicks = events.filter((event) => event.eventType === 'outbound_click').length;
  const contactSubmits = events.filter(
    (event) => event.eventType === 'contact_submit' || event.eventType === 'dm_submit',
  ).length;
  const uniqueVisitors = new Set(
    events.map((event) => event.visitorId).filter((value): value is string => Boolean(value)),
  ).size;

  const topDestinations = new Map<
    string,
    { label: string; clicks: number; resourceType: string | null }
  >();
  const topSections = new Map<
    string,
    { label: string; views: number; resourceType: string | null }
  >();

  for (const event of events) {
    if (event.eventType === 'outbound_click') {
      const label =
        event.resourceLabel ||
        (typeof event.metadata?.href === 'string'
          ? event.metadata.href
          : null) ||
        'Unknown destination';
      const key = `${event.resourceType ?? 'outbound'}:${label}`;
      const existing = topDestinations.get(key);
      if (existing) {
        existing.clicks += 1;
      } else {
        topDestinations.set(key, {
          label,
          clicks: 1,
          resourceType: event.resourceType,
        });
      }
    }

    if (event.eventType === 'section_view') {
      const label = event.resourceLabel || 'Untitled section';
      const key = `${event.resourceType ?? 'section'}:${label}`;
      const existing = topSections.get(key);
      if (existing) {
        existing.views += 1;
      } else {
        topSections.set(key, {
          label,
          views: 1,
          resourceType: event.resourceType,
        });
      }
    }
  }

  const topDestinationRows = [...topDestinations.values()]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);
  const topSectionRows = [...topSections.values()]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const recentActivity = events.slice(0, 8);

  const dailyMap = new Map<
    string,
    { views: number; sectionViews: number; clicks: number }
  >();
  for (const event of events) {
    const timestamp = event.createdAt ?? new Date(0);
    const key = new Date(timestamp).toLocaleDateString('en-CA');
    const bucket = dailyMap.get(key) ?? {
      views: 0,
      sectionViews: 0,
      clicks: 0,
    };
    if (event.eventType === 'page_view') bucket.views += 1;
    if (event.eventType === 'section_view') bucket.sectionViews += 1;
    if (event.eventType === 'outbound_click') bucket.clicks += 1;
    dailyMap.set(key, bucket);
  }

  const dailyRows = [...dailyMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
          Beta
        </span>
      </div>
      <p className="text-sm text-gray-400">
        Native views, outbound clicks, and recent visitor activity.
      </p>

      {!page ? (
        <div className="rounded-2xl border border-white/20 bg-white/5 p-8 text-center backdrop-blur-xl">
          <p className="text-gray-400">Create a page first to start collecting analytics.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Page views" value={formatNumber(pageViews)} helper="Tracked on every public page load" />
            <MetricCard label="Section views" value={formatNumber(sectionViews)} helper="Blocks seen by visitors" />
            <MetricCard label="Outbound clicks" value={formatNumber(outboundClicks)} helper="Clicks on external links and projects" />
            <MetricCard label="Unique visitors" value={formatNumber(uniqueVisitors)} helper="Based on stored visitor IDs" />
            <MetricCard
              label="Leads captured"
              value={formatNumber(contactSubmits)}
              helper="Contact form submissions"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="rounded-2xl border border-white/20 bg-white/5 p-6 backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-white">Recent activity</h2>
              <div className="mt-4 space-y-3">
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-gray-400">No events yet.</p>
                ) : (
                  recentActivity.map((event) => (
                    <div key={event.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {event.eventType === 'page_view'
                              ? 'Page viewed'
                              : event.eventType === 'section_view'
                                ? 'Section viewed'
                                : event.eventType === 'contact_submit' ||
                                    event.eventType === 'dm_submit'
                                  ? 'Lead captured'
                                  : event.eventType === 'hook_open'
                                    ? 'Chat opened'
                                    : event.eventType === 'chat_cta_click'
                                      ? 'Prompt clicked'
                                      : event.eventType === 'dm_start'
                                        ? 'DM started'
                                        : 'Outbound click'}
                          </p>
                          <p className="mt-1 text-sm text-gray-400">
                            {event.resourceLabel || event.resourceId || 'Public page'}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-gray-500">
                          {relativeTime(event.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/5 p-6 backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-white">Top destinations</h2>
              <div className="mt-4 space-y-3">
                {topDestinationRows.length === 0 ? (
                  <p className="text-sm text-gray-400">No outbound clicks yet.</p>
                ) : (
                  topDestinationRows.map((item) => (
                    <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{item.label}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {item.resourceType ?? 'outbound'}
                          </p>
                        </div>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                          {item.clicks}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/5 p-6 backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-white">Top sections</h2>
              <div className="mt-4 space-y-3">
                {topSectionRows.length === 0 ? (
                  <p className="text-sm text-gray-400">No section views yet.</p>
                ) : (
                  topSectionRows.map((item) => (
                    <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{item.label}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {item.resourceType ?? 'section'}
                          </p>
                        </div>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                          {item.views}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white">Last 7 days</h2>
            <div className="mt-4 space-y-3">
              {dailyRows.length === 0 ? (
                <p className="text-sm text-gray-400">No data yet.</p>
              ) : (
                dailyRows.map(([day, metrics]) => (
                  <div
                    key={day}
                    className="rounded-xl border border-white/10 bg-white/5 p-4 sm:grid sm:grid-cols-[120px_1fr_90px_90px_80px] sm:items-center sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0"
                  >
                    <p className="text-sm text-gray-400">{day}</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10 sm:mt-0">
                      <div
                        className="h-full rounded-full bg-cyan-400"
                        style={{ width: `${Math.min(100, metrics.views * 20)}%` }}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-white sm:contents sm:text-sm">
                      <p className="text-left sm:text-right">{metrics.views} views</p>
                      <p className="text-left sm:text-right">{metrics.sectionViews} section</p>
                      <p className="text-left sm:text-right">{metrics.clicks} clicks</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
