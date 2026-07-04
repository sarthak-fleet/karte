-- Inbound email inbox: slug@karte.cc catch-all via Cloudflare Email
-- Routing → standalone email-worker → POST /api/email/inbound (this app).
-- Bodies live in R2 (IMAGES_BUCKET); this table holds metadata + preview only.

ALTER TABLE pages ADD COLUMN emailInboxEnabled INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS receivedEmails (
  id TEXT PRIMARY KEY NOT NULL,
  pageId TEXT NOT NULL,
  fromAddress TEXT NOT NULL,
  fromName TEXT,
  subject TEXT,
  textPreview TEXT,
  r2Key TEXT,
  status TEXT NOT NULL DEFAULT 'unread',
  receivedAt INTEGER NOT NULL,
  readAt INTEGER,
  deletedAt INTEGER,
  FOREIGN KEY (pageId) REFERENCES pages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_receivedEmails_pageId ON receivedEmails(pageId);
CREATE INDEX IF NOT EXISTS idx_receivedEmails_pageId_status_receivedAt
  ON receivedEmails(pageId, status, receivedAt);
