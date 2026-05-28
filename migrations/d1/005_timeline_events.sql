-- Timeline events. Per docs/plans/timeline-block.md.
-- Dated career / project / life events that surface on the public
-- profile + feed every AI generation surface.

CREATE TABLE IF NOT EXISTS timelineEvents (
  id TEXT PRIMARY KEY,
  pageId TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,

  -- e.g. 'joined-company', 'shipped-project', 'launched-product',
  -- 'wrote-essay', 'spoke-at', 'moved-to', 'life-event',
  -- 'agent-deployed', 'agent-capability-added', 'custom'
  type TEXT NOT NULL,

  title TEXT NOT NULL,
  body TEXT,         -- optional 1-3 sentence detail
  whereLabel TEXT,   -- optional org / location / venue ('where' is reserved in some sql)
  link TEXT,         -- optional canonical URL (commit, blog post, etc.)
  imageUrl TEXT,     -- optional thumbnail

  -- Human-readable when label ('2024-03', 'March 2025', 'circa 2018').
  whenLabel TEXT NOT NULL,
  -- Sortable date for ordering. Use the first day of the month when
  -- whenLabel is month-precision; first of year when year-precision.
  sortDate INTEGER NOT NULL,

  -- 'manual' | 'github' | 'rss' | 'x' | 'substack'
  source TEXT NOT NULL DEFAULT 'manual',
  -- 'published' | 'pending-review' | 'hidden'
  -- pending-review hides from public + dashboard list; hidden is in AI
  -- memory but not on the public timeline.
  status TEXT NOT NULL DEFAULT 'published',

  -- Dedup key for auto-imports (commit sha, post guid, tweet id).
  externalId TEXT,

  createdAt INTEGER
);

-- Page + sortDate compound for the most common query (list a page's
-- events in reverse chronological order).
CREATE INDEX IF NOT EXISTS idx_timelineEvents_pageId_sortDate
  ON timelineEvents (pageId, sortDate DESC);

-- Idempotent auto-imports: a (pageId, source, externalId) row is
-- unique so re-running an import doesn't create duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS idx_timelineEvents_dedup
  ON timelineEvents (pageId, source, externalId)
  WHERE externalId IS NOT NULL;
