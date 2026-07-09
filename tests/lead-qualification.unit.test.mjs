import { strict as assert } from 'node:assert';
import { test } from 'vitest';

import { qualifyVisitorLeads } from '../src/lib/lead-qualification.ts';

const baseInput = {
  contacts: [],
  emails: [],
  conversations: [],
  messages: [],
  events: [],
};

test('dm_submit is scored like other direct lead submissions', () => {
  const contactLead = qualifyVisitorLeads({
    ...baseInput,
    contacts: [
      {
        id: 'contact-1',
        visitorId: 'visitor-1',
        name: 'Ada',
        email: 'ada@example.com',
        senderType: 'email',
        status: 'unread',
        message: 'Could we work together?',
        createdAt: new Date('2026-07-09T10:00:00Z'),
      },
    ],
    events: [
      {
        visitorId: 'visitor-1',
        eventType: 'dm_submit',
        resourceLabel: 'Ada',
        createdAt: new Date('2026-07-09T10:00:00Z'),
      },
    ],
  })[0];

  assert.equal(contactLead.contactCount, 1);
  assert.equal(contactLead.reasons.includes('verified contact'), true);
  assert.equal(contactLead.reasons.includes('unread inbound'), true);
  assert.equal(contactLead.nextAction, 'Reply to the verified message');
});

test('unread inbound email becomes a qualified lead', () => {
  const [lead] = qualifyVisitorLeads({
    ...baseInput,
    emails: [
      {
        id: 'email-1',
        fromAddress: 'producer@example.com',
        fromName: 'Film Producer',
        subject: 'Interview request',
        textPreview:
          'Can we hire you for a project next month? Budget and timeline are ready.',
        status: 'unread',
        receivedAt: new Date('2026-07-09T11:00:00Z'),
      },
    ],
  });

  assert.equal(lead.emailCount, 1);
  assert.equal(lead.name, 'Film Producer');
  assert.equal(lead.email, 'producer@example.com');
  assert.equal(lead.reasons.includes('inbound email'), true);
  assert.equal(lead.reasons.includes('unread email'), true);
  assert.equal(lead.nextAction, 'Reply from the email inbox');
  assert.match(lead.preview ?? '', /Interview request/);
  assert.ok(lead.score >= 50);
});

test('email address merges email and contact signals without a visitor id', () => {
  const [lead] = qualifyVisitorLeads({
    ...baseInput,
    contacts: [
      {
        id: 'contact-1',
        visitorId: null,
        name: 'Riya',
        email: 'riya@example.com',
        senderType: 'email',
        status: 'replied',
        message: 'I am interested in collaboration.',
        createdAt: new Date('2026-07-09T09:00:00Z'),
      },
    ],
    emails: [
      {
        id: 'email-1',
        fromAddress: 'riya@example.com',
        fromName: 'Riya S',
        subject: 'Following up',
        textPreview: 'Could we talk about pricing?',
        status: 'read',
        receivedAt: new Date('2026-07-09T12:00:00Z'),
      },
    ],
  });

  assert.equal(lead.contactCount, 1);
  assert.equal(lead.emailCount, 1);
  assert.equal(lead.email, 'riya@example.com');
  assert.equal(lead.name, 'Riya');
});
