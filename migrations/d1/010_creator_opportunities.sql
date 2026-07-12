-- Creator Opportunity Desk. Additive only; no existing data is transformed.
-- Apply explicitly before enabling the production surface. Request paths never
-- create or alter this table at runtime.

CREATE TABLE IF NOT EXISTS creatorOpportunities (
  id TEXT PRIMARY KEY NOT NULL,
  pageId TEXT NOT NULL,
  sourceType TEXT NOT NULL DEFAULT 'manual'
    CHECK (sourceType IN ('manual', 'timeline', 'lead', 'contact', 'conversation', 'email')),
  sourceId TEXT,
  sourceSnapshot TEXT NOT NULL,
  moment TEXT NOT NULL,
  target TEXT,
  creatorNotes TEXT,
  status TEXT NOT NULL DEFAULT 'signal'
    CHECK (status IN ('signal', 'drafted', 'approved', 'dismissed')),
  analysis TEXT,
  recipient TEXT,
  recipientVerified INTEGER NOT NULL DEFAULT 0,
  draftSubject TEXT,
  draftBody TEXT,
  approvedAt INTEGER,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  FOREIGN KEY (pageId) REFERENCES pages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_creatorOpportunities_page_status_updated
  ON creatorOpportunities(pageId, status, updatedAt DESC);
CREATE INDEX IF NOT EXISTS idx_creatorOpportunities_page_source
  ON creatorOpportunities(pageId, sourceType, sourceId);
