import 'server-only';

import { and, desc, eq, ne } from 'drizzle-orm';

import { db } from '@/db';
import {
  type CreatorOpportunitySourceSnapshot,
  type CreatorOpportunitySourceType,
  contactSubmissions,
  conversations,
  creatorOpportunities,
  messages,
  receivedEmails,
  timelineEvents,
} from '@/db/schema';

const MAX_SNAPSHOT = 1200;

function bounded(value: string | null | undefined, fallback: string): string {
  return (value?.trim() || fallback).slice(0, MAX_SNAPSHOT);
}

export async function listCreatorOpportunities(pageId: string) {
  return db
    .select()
    .from(creatorOpportunities)
    .where(eq(creatorOpportunities.pageId, pageId))
    .orderBy(desc(creatorOpportunities.updatedAt));
}

export async function getCreatorOpportunity(
  pageId: string,
  opportunityId: string,
) {
  const [opportunity] = await db
    .select()
    .from(creatorOpportunities)
    .where(
      and(
        eq(creatorOpportunities.id, opportunityId),
        eq(creatorOpportunities.pageId, pageId),
      ),
    )
    .limit(1);
  return opportunity ?? null;
}

export async function resolveOpportunitySource(input: {
  pageId: string;
  sourceType: CreatorOpportunitySourceType;
  sourceId?: string | null;
  moment: string;
}): Promise<CreatorOpportunitySourceSnapshot> {
  if (input.sourceType === 'manual') {
    return {
      label: 'Manual moment',
      summary: bounded(input.moment, 'Creator-entered signal'),
    };
  }
  if (!input.sourceId)
    throw new Error('A source is required for this opportunity type.');

  if (input.sourceType === 'timeline') {
    const [row] = await db
      .select()
      .from(timelineEvents)
      .where(
        and(
          eq(timelineEvents.id, input.sourceId),
          eq(timelineEvents.pageId, input.pageId),
        ),
      )
      .limit(1);
    if (!row) throw new Error('Source not found for this page.');
    return {
      label: row.title,
      summary: bounded(row.body, row.title),
      occurredAt: row.sortDate.toISOString(),
    };
  }

  if (input.sourceType === 'contact') {
    const [row] = await db
      .select()
      .from(contactSubmissions)
      .where(
        and(
          eq(contactSubmissions.id, input.sourceId),
          eq(contactSubmissions.pageId, input.pageId),
        ),
      )
      .limit(1);
    if (!row) throw new Error('Source not found for this page.');
    return {
      label: `Contact from ${row.name}`,
      summary: bounded(row.message, 'Contact submission'),
      recipient: row.email,
      occurredAt: row.createdAt?.toISOString(),
    };
  }

  if (input.sourceType === 'email') {
    const [row] = await db
      .select()
      .from(receivedEmails)
      .where(
        and(
          eq(receivedEmails.id, input.sourceId),
          eq(receivedEmails.pageId, input.pageId),
          ne(receivedEmails.status, 'deleted'),
        ),
      )
      .limit(1);
    if (!row) throw new Error('Source not found for this page.');
    return {
      label: bounded(row.subject, `Email from ${row.fromAddress}`),
      summary: bounded(row.textPreview, 'Inbound email'),
      recipient: row.fromAddress,
      occurredAt: row.receivedAt?.toISOString(),
    };
  }

  if (input.sourceType === 'conversation') {
    const [row] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, input.sourceId),
          eq(conversations.pageId, input.pageId),
        ),
      )
      .limit(1);
    if (!row) throw new Error('Source not found for this page.');
    const [message] = await db
      .select({ content: messages.content })
      .from(messages)
      .where(
        and(eq(messages.conversationId, row.id), eq(messages.role, 'user')),
      )
      .orderBy(desc(messages.createdAt))
      .limit(1);
    return {
      label: row.visitorEmail
        ? `Chat with ${row.visitorEmail}`
        : 'Visitor chat',
      summary: bounded(message?.content, 'Visitor conversation'),
      recipient: row.visitorEmail ?? undefined,
      occurredAt: row.createdAt?.toISOString(),
    };
  }

  throw new Error(
    'Lead opportunities must use their underlying email, contact, or chat source.',
  );
}

export async function listEligibleOpportunitySources(pageId: string) {
  const [timeline, contacts, emails, chats] = await Promise.all([
    db
      .select({
        id: timelineEvents.id,
        label: timelineEvents.title,
        summary: timelineEvents.body,
        occurredAt: timelineEvents.sortDate,
      })
      .from(timelineEvents)
      .where(eq(timelineEvents.pageId, pageId))
      .orderBy(desc(timelineEvents.sortDate))
      .limit(20),
    db
      .select({
        id: contactSubmissions.id,
        label: contactSubmissions.name,
        summary: contactSubmissions.message,
        occurredAt: contactSubmissions.createdAt,
      })
      .from(contactSubmissions)
      .where(eq(contactSubmissions.pageId, pageId))
      .orderBy(desc(contactSubmissions.createdAt))
      .limit(20),
    db
      .select({
        id: receivedEmails.id,
        label: receivedEmails.subject,
        summary: receivedEmails.textPreview,
        occurredAt: receivedEmails.receivedAt,
      })
      .from(receivedEmails)
      .where(
        and(
          eq(receivedEmails.pageId, pageId),
          ne(receivedEmails.status, 'deleted'),
        ),
      )
      .orderBy(desc(receivedEmails.receivedAt))
      .limit(20),
    db
      .select({
        id: conversations.id,
        label: conversations.visitorEmail,
        occurredAt: conversations.createdAt,
      })
      .from(conversations)
      .where(eq(conversations.pageId, pageId))
      .orderBy(desc(conversations.createdAt))
      .limit(20),
  ]);

  return [
    ...timeline.map((row) => ({
      type: 'timeline' as const,
      id: row.id,
      label: row.label,
      summary: bounded(row.summary, row.label),
      occurredAt: row.occurredAt?.toISOString(),
    })),
    ...contacts.map((row) => ({
      type: 'contact' as const,
      id: row.id,
      label: `Contact: ${row.label}`,
      summary: bounded(row.summary, 'Contact submission'),
      occurredAt: row.occurredAt?.toISOString(),
    })),
    ...emails.map((row) => ({
      type: 'email' as const,
      id: row.id,
      label: bounded(row.label, 'Inbound email'),
      summary: bounded(row.summary, 'Inbound email'),
      occurredAt: row.occurredAt?.toISOString(),
    })),
    ...chats.map((row) => ({
      type: 'conversation' as const,
      id: row.id,
      label: row.label ? `Chat: ${row.label}` : 'Visitor chat',
      summary: 'Visitor conversation',
      occurredAt: row.occurredAt?.toISOString(),
    })),
  ].sort((left, right) =>
    (right.occurredAt ?? '').localeCompare(left.occurredAt ?? ''),
  );
}
