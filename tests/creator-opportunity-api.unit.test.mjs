import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  loadOwnedPage: vi.fn(),
  listCreatorOpportunities: vi.fn(),
  listEligibleOpportunitySources: vi.fn(),
  resolveOpportunitySource: vi.fn(),
  insert: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/api-auth', () => ({
  requireUser: mocks.requireUser,
  loadOwnedPage: mocks.loadOwnedPage,
}));
vi.mock('@/lib/creator-opportunity-data', () => ({
  listCreatorOpportunities: mocks.listCreatorOpportunities,
  listEligibleOpportunitySources: mocks.listEligibleOpportunitySources,
  resolveOpportunitySource: mocks.resolveOpportunitySource,
}));
vi.mock('@/db', () => ({ db: { insert: mocks.insert } }));

import {
  GET,
  POST,
} from '../src/app/api/pages/[pageId]/opportunities/route.ts';

const context = { params: Promise.resolve({ pageId: 'page-1' }) };

describe('creator opportunity API ownership and failure boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({
      userId: 'owner-1',
      user: { id: 'owner-1' },
    });
    mocks.loadOwnedPage.mockResolvedValue({ id: 'page-1', userId: 'owner-1' });
    mocks.listCreatorOpportunities.mockResolvedValue([]);
    mocks.listEligibleOpportunitySources.mockResolvedValue([]);
  });

  it('rejects cross-owner access before reading opportunity content', async () => {
    mocks.loadOwnedPage.mockResolvedValueOnce(null);
    const response = await GET(new Request('http://localhost'), context);
    assert.equal(response.status, 404);
    assert.equal(mocks.listCreatorOpportunities.mock.calls.length, 0);
  });

  it('rejects a source that does not belong to the page', async () => {
    mocks.resolveOpportunitySource.mockRejectedValueOnce(
      new Error('Source not found for this page.'),
    );
    const response = await POST(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'timeline',
          sourceId: 'foreign-event',
          moment: 'A commercial moment',
        }),
      }),
      context,
    );
    assert.equal(response.status, 400);
    assert.equal(mocks.insert.mock.calls.length, 0);
  });

  it('fails closed with recovery copy when the migration is missing', async () => {
    mocks.listCreatorOpportunities.mockRejectedValueOnce(
      new Error('D1_ERROR: no such table: creatorOpportunities'),
    );
    const response = await GET(new Request('http://localhost'), context);
    assert.equal(response.status, 503);
    const payload = await response.json();
    assert.equal(payload.retryable, true);
  });
});
