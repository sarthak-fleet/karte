import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  loadOwnedPage: vi.fn(),
  getCreatorOpportunity: vi.fn(),
  rateLimit: vi.fn(),
  generate: vi.fn(),
  resolveAiConfig: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/api-auth', () => ({
  requireUser: mocks.requireUser,
  loadOwnedPage: mocks.loadOwnedPage,
}));
vi.mock('@/lib/creator-opportunity-data', () => ({
  getCreatorOpportunity: mocks.getCreatorOpportunity,
}));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: mocks.rateLimit }));
vi.mock('@/lib/ai-client', () => ({
  generate: mocks.generate,
  resolveAiConfig: mocks.resolveAiConfig,
}));
vi.mock('@/db', () => ({
  db: { select: mocks.select, update: mocks.update },
}));

import { POST } from '../src/app/api/pages/[pageId]/opportunities/[opportunityId]/generate/route.ts';

const context = {
  params: Promise.resolve({ pageId: 'page-1', opportunityId: 'opportunity-1' }),
};

describe('creator opportunity generation failure preservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({
      userId: 'owner-1',
      user: { id: 'owner-1' },
    });
    mocks.loadOwnedPage.mockResolvedValue({
      id: 'page-1',
      userId: 'owner-1',
      displayName: 'Creator',
      bio: 'Creator bio',
    });
    mocks.rateLimit.mockResolvedValue({ ok: true });
    mocks.getCreatorOpportunity.mockResolvedValue({
      id: 'opportunity-1',
      pageId: 'page-1',
      sourceSnapshot: { label: 'Signal', summary: 'Selected source only' },
      moment: 'Commercial moment',
      target: null,
      creatorNotes: null,
    });
    mocks.resolveAiConfig.mockReturnValue({
      endpointUrl: 'https://example.com',
      apiKey: 'test',
      model: 'test',
    });
    mocks.select.mockImplementation(() => ({
      from: () => ({
        where: () => ({ limit: async () => [] }),
      }),
    }));
  });

  it('does not persist when the AI provider fails', async () => {
    mocks.generate.mockRejectedValueOnce(new Error('provider unavailable'));
    const response = await POST(
      new Request('http://localhost', { method: 'POST' }),
      context,
    );
    assert.equal(response.status, 502);
    assert.equal(mocks.update.mock.calls.length, 0);
  });

  it('does not replace a prior draft when model JSON is invalid', async () => {
    mocks.generate.mockResolvedValueOnce('{"title":"incomplete"}');
    const response = await POST(
      new Request('http://localhost', { method: 'POST' }),
      context,
    );
    assert.equal(response.status, 502);
    assert.equal(mocks.update.mock.calls.length, 0);
    const payload = await response.json();
    assert.match(payload.error, /preserved/i);
  });
});
