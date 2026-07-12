import { and, asc, desc, eq, ne } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { db, ensureProjectsTable } from '@/db';
import {
  contactSubmissions,
  conversations,
  messages,
  pageEvents,
  receivedEmails,
} from '@/db/schema';
import { getCurrentPage, getSession } from '@/lib/auth-server';
import {
  type QualifiedLead,
  qualifyVisitorLeads,
} from '@/lib/lead-qualification';

function formatDate(value: Date | null) {
  if (!value) {
    return 'Unknown';
  }

  return value.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function tierClasses(tier: QualifiedLead['tier']) {
  if (tier === 'hot') {
    return 'border-red-300/30 bg-red-300/10 text-red-100';
  }

  if (tier === 'warm') {
    return 'border-amber-300/30 bg-amber-300/10 text-amber-100';
  }

  if (tier === 'exploring') {
    return 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100';
  }

  return 'border-karte-border-emphasis bg-white/5 text-karte-text-2';
}

function sourceBadge(lead: QualifiedLead) {
  if (lead.emailCount > 0 && lead.contactCount > 0) {
    return {
      label: 'Email + contact',
      tone: 'border-violet-300/30 bg-violet-300/10 text-violet-100',
    };
  }
  if (lead.emailCount > 0 && lead.conversationCount > 0) {
    return {
      label: 'Email + chat',
      tone: 'border-violet-300/30 bg-violet-300/10 text-violet-100',
    };
  }
  if (lead.contactCount > 0 && lead.conversationCount > 0) {
    return {
      label: 'Chat + contact',
      tone: 'border-violet-300/30 bg-violet-300/10 text-violet-100',
    };
  }
  if (lead.contactCount > 0) {
    return {
      label: 'From contact form',
      tone: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
    };
  }
  if (lead.emailCount > 0) {
    return {
      label: 'From email',
      tone: 'border-indigo-300/30 bg-indigo-300/10 text-indigo-100',
    };
  }
  if (lead.conversationCount > 0) {
    return {
      label: 'From chat',
      tone: 'border-sky-300/30 bg-sky-300/10 text-sky-100',
    };
  }
  return null;
}

function metricLabel(lead: QualifiedLead) {
  const parts = [
    lead.contactCount > 0
      ? `${lead.contactCount} DM${lead.contactCount === 1 ? '' : 's'}`
      : '',
    lead.emailCount > 0
      ? `${lead.emailCount} email${lead.emailCount === 1 ? '' : 's'}`
      : '',
    lead.conversationCount > 0
      ? `${lead.conversationCount} chat${lead.conversationCount === 1 ? '' : 's'}`
      : '',
    lead.eventCount > 0
      ? `${lead.eventCount} event${lead.eventCount === 1 ? '' : 's'}`
      : '',
  ].filter(Boolean);

  return parts.join(' / ') || 'No tracked signals';
}

export default async function LeadsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  await ensureProjectsTable();

  const page = await getCurrentPage(session.user.id);

  if (!page) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold text-karte-text">Lead Radar</h1>
        <p className="text-sm text-karte-text-3">
          Create a page first to qualify visitor activity.
        </p>
      </div>
    );
  }

  const [contacts, inboundEmails, chatThreads, chatMessages, events] =
    await Promise.all([
      db
        .select()
        .from(contactSubmissions)
        .where(eq(contactSubmissions.pageId, page.id))
        .orderBy(desc(contactSubmissions.createdAt)),
      db
        .select({
          id: receivedEmails.id,
          fromAddress: receivedEmails.fromAddress,
          fromName: receivedEmails.fromName,
          subject: receivedEmails.subject,
          textPreview: receivedEmails.textPreview,
          status: receivedEmails.status,
          receivedAt: receivedEmails.receivedAt,
        })
        .from(receivedEmails)
        .where(
          and(
            eq(receivedEmails.pageId, page.id),
            ne(receivedEmails.status, 'deleted'),
          ),
        )
        .orderBy(desc(receivedEmails.receivedAt)),
      db
        .select({
          id: conversations.id,
          visitorId: conversations.visitorId,
          visitorEmail: conversations.visitorEmail,
          createdAt: conversations.createdAt,
        })
        .from(conversations)
        .where(eq(conversations.pageId, page.id))
        .orderBy(desc(conversations.createdAt)),
      db
        .select({
          conversationId: messages.conversationId,
          role: messages.role,
          content: messages.content,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .innerJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(eq(conversations.pageId, page.id))
        .orderBy(asc(messages.createdAt)),
      db
        .select({
          visitorId: pageEvents.visitorId,
          eventType: pageEvents.eventType,
          resourceLabel: pageEvents.resourceLabel,
          createdAt: pageEvents.createdAt,
        })
        .from(pageEvents)
        .where(eq(pageEvents.pageId, page.id))
        .orderBy(desc(pageEvents.createdAt))
        .limit(500),
    ]);

  const leads = qualifyVisitorLeads({
    contacts,
    emails: inboundEmails,
    conversations: chatThreads,
    messages: chatMessages,
    events,
  });
  const hotCount = leads.filter((lead) => lead.tier === 'hot').length;
  const warmCount = leads.filter((lead) => lead.tier === 'warm').length;
  const averageScore =
    leads.length === 0
      ? 0
      : Math.round(
          leads.reduce((total, lead) => total + lead.score, 0) / leads.length,
        );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-karte-text">Lead Radar</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-karte-text-3">
            Qualified visitors from direct messages, inbound email, chat
            transcripts, and tracked profile activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/opportunities"
            className="rounded-lg border border-karte-accent/35 px-4 py-2 text-sm font-medium text-karte-accent transition hover:bg-karte-accent/10"
          >
            Opportunity Desk
          </Link>
          <Link
            href="/dashboard/inbox"
            className="rounded-lg border border-karte-border-emphasis bg-white/5 px-4 py-2 text-sm font-medium text-karte-text transition hover:bg-white/10"
          >
            Inbox
          </Link>
          <Link
            href="/dashboard/chats"
            className="rounded-lg border border-karte-border-emphasis bg-white/5 px-4 py-2 text-sm font-medium text-karte-text transition hover:bg-white/10"
          >
            Chats
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Qualified visitors', value: leads.length },
          { label: 'Hot', value: hotCount },
          { label: 'Warm', value: warmCount },
          { label: 'Avg score', value: averageScore },
        ].map((metric) => (
          <div key={metric.label} className="rounded-2xl bg-white/[0.025] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-karte-text-4">
              {metric.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-karte-text">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {leads.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.02] p-8 text-center">
          <p className="text-karte-text-3">
            No qualified leads yet. Visitors will appear here once they chat,
            click, or send a message.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="rounded-2xl bg-white/[0.025] p-5 transition hover:bg-white/[0.04]"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-karte-text">
                      {lead.name}
                    </h2>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${tierClasses(lead.tier)}`}
                    >
                      {lead.tier}
                    </span>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-karte-text">
                      {lead.score}/100
                    </span>
                    {(() => {
                      const badge = sourceBadge(lead);
                      return badge ? (
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${badge.tone}`}
                        >
                          {badge.label}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <p className="mt-1 text-sm text-karte-text-3">
                    {lead.email ?? lead.visitorId ?? 'Anonymous visitor'} /{' '}
                    {metricLabel(lead)}
                  </p>
                </div>
                <div className="text-left lg:text-right">
                  <p className="text-sm font-medium text-karte-text">
                    {lead.nextAction}
                  </p>
                  <p className="mt-1 text-xs text-karte-text-4">
                    Last seen {formatDate(lead.lastSeenAt)}
                  </p>
                </div>
              </div>

              {lead.preview && (
                <p className="mt-4 line-clamp-3 whitespace-pre-wrap rounded-xl bg-black/25 p-4 text-sm leading-6 text-karte-text-2">
                  {lead.preview}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {lead.reasons.map((reason) => (
                  <span
                    key={reason}
                    className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-karte-text-2"
                  >
                    {reason}
                  </span>
                ))}
                {lead.sourceLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-xs text-cyan-100"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
