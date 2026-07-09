import { and, eq, ne } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { IntentOnboarding } from '@/components/dashboard/intent-onboarding';
import { db, ensureProjectsTable } from '@/db';
import {
  contactSubmissions,
  conversations,
  generatedPages,
  infoBlocks,
  links,
  projects,
  receivedEmails,
} from '@/db/schema';
import { getCurrentPage, getSession } from '@/lib/auth-server';

function statusLabel(done: boolean) {
  return done ? 'Done' : 'Next';
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  await ensureProjectsTable();

  const page = await getCurrentPage(session.user.id);

  if (!page) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-2xl font-bold text-karte-text">Dashboard</h1>
        <p className="text-sm text-karte-text-3">
          Create a profile before setting up your interactive experience.
        </p>
        <Link
          href="/dashboard/appearance"
          className="mt-6 inline-flex rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
        >
          Create Profile
        </Link>
      </div>
    );
  }

  const [
    pageLinks,
    pageProjects,
    memoryBlocks,
    readyGeneratedPages,
    inboxMessages,
    emailMessages,
    chatThreads,
  ] = await Promise.all([
    db.select({ id: links.id }).from(links).where(eq(links.pageId, page.id)),
    db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.pageId, page.id)),
    db
      .select({ id: infoBlocks.id })
      .from(infoBlocks)
      .where(eq(infoBlocks.pageId, page.id)),
    db
      .select({ type: generatedPages.type })
      .from(generatedPages)
      .where(
        and(
          eq(generatedPages.pageId, page.id),
          eq(generatedPages.status, 'ready'),
        ),
      ),
    db
      .select({ id: contactSubmissions.id })
      .from(contactSubmissions)
      .where(eq(contactSubmissions.pageId, page.id)),
    db
      .select({ id: receivedEmails.id })
      .from(receivedEmails)
      .where(
        and(
          eq(receivedEmails.pageId, page.id),
          ne(receivedEmails.status, 'deleted'),
        ),
      ),
    db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.pageId, page.id)),
  ]);

  const readyModeCount = new Set(
    readyGeneratedPages.filter((item) => item.type).map((item) => item.type),
  ).size;
  const inboundCount =
    inboxMessages.length + emailMessages.length + chatThreads.length;

  const setupItems = [
    {
      label: 'Publish profile',
      done: Boolean(page.published),
      href: '/dashboard/appearance',
    },
    {
      label: 'Add links',
      done: pageLinks.length >= 3,
      href: '/dashboard/links',
    },
    {
      label: 'Add projects',
      done: pageProjects.length >= 1,
      href: '/dashboard/projects',
    },
    {
      label: 'Add AI memory',
      done: memoryBlocks.length >= 2,
      href: '/dashboard/memory',
    },
    {
      label: 'Pick a theme',
      done: Boolean(page.themeConfig?.presetId),
      href: '/dashboard/appearance',
    },
    {
      label: 'Enable chat assistant',
      done: Boolean(page.chatEnabled),
      href: '/dashboard/chats',
    },
    {
      label: 'Enable direct messages',
      done: page.dmMode !== 'off',
      href: '/dashboard/appearance',
    },
    {
      label: 'Enable inbound email',
      done: Boolean(page.emailInboxEnabled),
      href: '/dashboard/email',
    },
    {
      label: 'Generate profile modes',
      done: readyModeCount >= 1,
      href: '/dashboard/appearance',
    },
  ];

  const completedCount = setupItems.filter((item) => item.done).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-karte-text">Dashboard</h1>
          <p className="mt-1 text-sm text-karte-text-3">
            Shape the profile visitors can explore, ask, and message.
          </p>
        </div>
        <Link
          href={`/${page.slug}`}
          target="_blank"
          className="rounded-lg border border-karte-border-emphasis bg-white/5 px-4 py-2 text-sm font-medium text-karte-text transition hover:bg-white/10"
        >
          View /{page.slug}
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Links', value: pageLinks.length },
          { label: 'Projects', value: pageProjects.length },
          { label: 'Agent surfaces', value: readyModeCount },
          { label: 'Inbounds', value: inboundCount },
        ].map((metric) => (
          <div key={metric.label} className="rounded-2xl bg-white/[0.025] p-5">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-karte-text-4">
              {metric.label}
            </p>
            <p className="mt-3 text-3xl font-bold text-karte-text">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <IntentOnboarding
        pageId={page.id}
        initialPageSettings={page.pageSettings ?? {}}
      />

      <div className="rounded-2xl bg-white/[0.02] p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-karte-text">
              Launch Checklist
            </h2>
            <p className="mt-1 text-sm text-karte-text-3">
              {completedCount} of {setupItems.length} setup steps complete for a
              public inbound agent.
            </p>
          </div>
          <div className="h-2 rounded-full bg-white/10 sm:w-48">
            <div
              className="h-2 rounded-full bg-cyan-300"
              style={{
                width: `${(completedCount / setupItems.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {setupItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between rounded-xl border border-karte-border-strong bg-black/20 px-4 py-3 transition hover:border-white/25 hover:bg-white/[0.04]"
            >
              <span className="text-sm font-medium text-karte-text">
                {item.label}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  item.done
                    ? 'bg-green-400/10 text-green-300'
                    : 'bg-cyan-300/10 text-cyan-200'
                }`}
              >
                {statusLabel(item.done)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
