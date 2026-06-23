type DateLike = Date | string | number | null | undefined;

export type ContactLeadSignal = {
  id: string;
  visitorId: string | null;
  name: string;
  email: string;
  senderType: 'anonymous' | 'email';
  status: 'unread' | 'replied' | 'archived';
  message: string;
  createdAt: DateLike;
};

export type ConversationLeadSignal = {
  id: string;
  visitorId: string | null;
  visitorEmail?: string | null;
  createdAt: DateLike;
};

export type MessageLeadSignal = {
  conversationId: string;
  role: string;
  content: string;
  createdAt: DateLike;
};

export type EventLeadSignal = {
  visitorId: string | null;
  eventType: string;
  resourceLabel: string | null;
  createdAt: DateLike;
};

export type QualifiedLead = {
  id: string;
  visitorId: string | null;
  name: string;
  email: string | null;
  score: number;
  tier: 'hot' | 'warm' | 'exploring' | 'cold';
  nextAction: string;
  reasons: string[];
  lastSeenAt: Date | null;
  contactCount: number;
  conversationCount: number;
  userMessageCount: number;
  eventCount: number;
  preview: string | null;
  sourceLabels: string[];
};

type LeadBucket = {
  id: string;
  visitorId: string | null;
  conversationEmail: string | null;
  contacts: ContactLeadSignal[];
  conversations: ConversationLeadSignal[];
  messages: MessageLeadSignal[];
  events: EventLeadSignal[];
};

const BUYING_INTENT_PATTERNS = [
  /\b(hire|hiring|job|role|recruit|founder|client|customer|contract)\b/i,
  /\b(work together|collaborate|consult|project|build|available)\b/i,
  /\b(price|pricing|budget|timeline|deadline|proposal)\b/i,
];

const QUESTION_PATTERN =
  /\b(can|could|would|how|what|when|where|why|interested|available)\b/i;

function toDate(value: DateLike) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateTime(value: DateLike) {
  return toDate(value)?.getTime() ?? 0;
}

function latestDate(values: DateLike[]) {
  const dates = values
    .map(toDate)
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => b.getTime() - a.getTime());

  return dates[0] ?? null;
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getBucketId(
  prefix: string,
  visitorId: string | null,
  fallback: string,
) {
  return visitorId ? `visitor:${visitorId}` : `${prefix}:${fallback}`;
}

function getTier(score: number): QualifiedLead['tier'] {
  if (score >= 70) {
    return 'hot';
  }

  if (score >= 45) {
    return 'warm';
  }

  if (score >= 20) {
    return 'exploring';
  }

  return 'cold';
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function getNextAction(lead: QualifiedLead) {
  if (lead.contactCount > 0 && lead.email) {
    return 'Reply to the verified message';
  }

  if (lead.contactCount > 0) {
    return 'Review the anonymous DM';
  }

  if (lead.userMessageCount > 0 && lead.email) {
    return 'Follow up — they left an email in chat';
  }

  if (lead.userMessageCount > 0) {
    return 'Open the chat transcript';
  }

  if (lead.eventCount > 2) {
    return 'Check what they clicked';
  }

  return 'Wait for a stronger signal';
}

export function qualifyVisitorLeads({
  contacts,
  conversations,
  messages,
  events,
}: {
  contacts: ContactLeadSignal[];
  conversations: ConversationLeadSignal[];
  messages: MessageLeadSignal[];
  events: EventLeadSignal[];
}) {
  const buckets = new Map<string, LeadBucket>();
  const conversationToBucket = new Map<string, string>();

  function ensureBucket(id: string, visitorId: string | null) {
    const existing = buckets.get(id);
    if (existing) {
      return existing;
    }

    const bucket: LeadBucket = {
      id,
      visitorId,
      conversationEmail: null,
      contacts: [],
      conversations: [],
      messages: [],
      events: [],
    };
    buckets.set(id, bucket);
    return bucket;
  }

  for (const contact of contacts) {
    const bucket = ensureBucket(
      getBucketId('contact', contact.visitorId, contact.id),
      contact.visitorId,
    );
    bucket.contacts.push(contact);
  }

  for (const conversation of conversations) {
    const bucketId = getBucketId(
      'conversation',
      conversation.visitorId,
      conversation.id,
    );
    const bucket = ensureBucket(bucketId, conversation.visitorId);
    bucket.conversations.push(conversation);
    if (conversation.visitorEmail && !bucket.conversationEmail) {
      bucket.conversationEmail = conversation.visitorEmail;
    }
    conversationToBucket.set(conversation.id, bucketId);
  }

  for (const message of messages) {
    const bucketId = conversationToBucket.get(message.conversationId);
    if (!bucketId) {
      continue;
    }

    buckets.get(bucketId)?.messages.push(message);
  }

  for (const event of events) {
    if (!event.visitorId) {
      continue;
    }

    const bucket = ensureBucket(`visitor:${event.visitorId}`, event.visitorId);
    bucket.events.push(event);
  }

  return [...buckets.values()]
    .map((bucket) => {
      const userMessages = bucket.messages.filter(
        (message) => message.role === 'user',
      );
      const contact = [...bucket.contacts].sort(
        (a, b) => dateTime(b.createdAt) - dateTime(a.createdAt),
      )[0];
      const allText = [
        ...bucket.contacts.map((item) => item.message),
        ...userMessages.map((item) => item.content),
      ].join('\n');

      const reasons: string[] = [];
      let score = 0;

      if (bucket.contacts.length > 0) {
        score += contact?.senderType === 'email' ? 35 : 24;
        reasons.push(
          contact?.senderType === 'email' ? 'verified contact' : 'anonymous DM',
        );
      } else if (bucket.conversationEmail) {
        // Chat-derived email: lead capture via the chat gate.
        score += 28;
        reasons.push('chat email captured');
      }

      if (bucket.contacts.some((item) => item.status === 'unread')) {
        score += 8;
        reasons.push('unread inbound');
      }

      if (userMessages.length > 0) {
        score += Math.min(30, 10 + userMessages.length * 4);
        reasons.push(
          `${userMessages.length} chat message${userMessages.length === 1 ? '' : 's'}`,
        );
      }

      const intentHits = BUYING_INTENT_PATTERNS.filter((pattern) =>
        pattern.test(allText),
      ).length;
      if (intentHits > 0) {
        score += 12 + intentHits * 6;
        reasons.push('high-intent wording');
      }

      if (QUESTION_PATTERN.test(allText)) {
        score += 6;
        reasons.push('asked a question');
      }

      const eventScore = bucket.events.reduce((total, event) => {
        if (
          event.eventType === 'contact_submit' ||
          event.eventType === 'dm_submit'
        ) {
          return total + 12;
        }

        if (
          event.eventType === 'chat_cta_click' ||
          event.eventType === 'hook_open'
        ) {
          return total + 5;
        }

        if (event.eventType === 'outbound_click') {
          return total + 4;
        }

        if (event.eventType === 'section_view') {
          return total + 2;
        }

        return total + 1;
      }, 0);
      if (eventScore > 0) {
        score += Math.min(20, eventScore);
        reasons.push(
          `${bucket.events.length} tracked event${bucket.events.length === 1 ? '' : 's'}`,
        );
      }

      const lastSeenAt = latestDate([
        ...bucket.contacts.map((item) => item.createdAt),
        ...bucket.conversations.map((item) => item.createdAt),
        ...bucket.messages.map((item) => item.createdAt),
        ...bucket.events.map((item) => item.createdAt),
      ]);
      if (
        lastSeenAt &&
        Date.now() - lastSeenAt.getTime() <= 1000 * 60 * 60 * 24 * 7
      ) {
        score += 8;
        reasons.push('recent activity');
      }

      const clampedScore = clampScore(score);
      const sourceLabels = uniqueStrings(
        bucket.events
          .map((event) => event.resourceLabel ?? '')
          .filter((label) => label.length > 0)
          .slice(0, 4),
      );
      const resolvedEmail =
        (contact?.senderType === 'email' ? contact.email : null) ??
        bucket.conversationEmail ??
        null;
      const resolvedName =
        contact?.name ||
        (resolvedEmail ? resolvedEmail.split('@')[0] : null) ||
        (bucket.visitorId
          ? `Visitor ${bucket.visitorId.slice(0, 8)}`
          : 'Anonymous visitor');

      const lead: QualifiedLead = {
        id: bucket.id,
        visitorId: bucket.visitorId,
        name: resolvedName,
        email: resolvedEmail,
        score: clampedScore,
        tier: getTier(clampedScore),
        nextAction: '',
        reasons: uniqueStrings(reasons),
        lastSeenAt,
        contactCount: bucket.contacts.length,
        conversationCount: bucket.conversations.length,
        userMessageCount: userMessages.length,
        eventCount: bucket.events.length,
        preview:
          contact?.message ||
          userMessages.sort(
            (a, b) => dateTime(b.createdAt) - dateTime(a.createdAt),
          )[0]?.content ||
          null,
        sourceLabels,
      };

      return { ...lead, nextAction: getNextAction(lead) };
    })
    .filter((lead) => lead.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return (b.lastSeenAt?.getTime() ?? 0) - (a.lastSeenAt?.getTime() ?? 0);
    });
}
