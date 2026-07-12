import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  applyOpportunityLifecyclePatch,
  buildOpportunityMailto,
  parseGeneratedOpportunityBrief,
} from '../src/lib/creator-opportunities.ts';

const analysis = {
  schemaVersion: 1,
  title: 'Rail travel partnership',
  leadTime: 'Pitch within two weeks',
  fitRationale: 'Audience questions show credible product interest.',
  riskNotes: ['Do not overstate audience intent.'],
  partnershipAngles: ['Field test a carry-on kit.'],
  brandCategories: ['Travel gear'],
  namedBrandHypotheses: ['Example Brand'],
};

function drafted(overrides = {}) {
  return {
    status: 'drafted',
    analysis,
    recipient: null,
    recipientVerified: false,
    draftSubject: 'A practical rail-travel field test',
    draftBody: 'Would you be open to a creator-led field test?',
    approvedAt: null,
    ...overrides,
  };
}

describe('creator opportunity contracts', () => {
  it('parses fenced structured output and rejects invalid model JSON', () => {
    const parsed = parseGeneratedOpportunityBrief(
      `\`\`\`json\n${JSON.stringify({ ...analysis, draft: { subject: 'Subject', body: 'Body' } })}\n\`\`\``,
    );
    assert.equal(parsed.title, analysis.title);
    assert.throws(() => parseGeneratedOpportunityBrief('{"title":"partial"}'));
  });

  it('requires a valid draft before approval', () => {
    assert.throws(() =>
      applyOpportunityLifecyclePatch(
        drafted({ analysis: null, draftSubject: null, draftBody: null }),
        { action: 'approve' },
      ),
    );
  });

  it('records approval and resets it after a material edit', () => {
    const approved = applyOpportunityLifecyclePatch(drafted(), {
      action: 'approve',
    });
    assert.equal(approved.status, 'approved');
    assert.ok(approved.approvedAt instanceof Date);

    const edited = applyOpportunityLifecyclePatch(
      drafted({ status: 'approved', approvedAt: new Date() }),
      { draftBody: 'Updated body' },
    );
    assert.equal(edited.status, 'drafted');
    assert.equal(edited.approvedAt, null);
  });

  it('dismisses without deleting and builds mailto only after verified approval', () => {
    const dismissed = applyOpportunityLifecyclePatch(drafted(), {
      action: 'dismiss',
    });
    assert.equal(dismissed.status, 'dismissed');

    assert.equal(
      buildOpportunityMailto({
        status: 'drafted',
        recipient: 'brand@example.com',
        recipientVerified: true,
        subject: 'Subject',
        body: 'Body',
      }),
      null,
    );
    const mailto = buildOpportunityMailto({
      status: 'approved',
      recipient: 'brand@example.com',
      recipientVerified: true,
      subject: 'Subject',
      body: 'Body',
    });
    assert.match(mailto, /^mailto:brand%40example\.com\?/);
    assert.match(mailto, /subject=Subject/);
  });
});
