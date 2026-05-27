-- New columns to support richer link variants + page-level quick actions.
-- All nullable so existing rows keep working unchanged.

ALTER TABLE links ADD COLUMN imageUrl TEXT;
ALTER TABLE links ADD COLUMN body TEXT;

ALTER TABLE pages ADD COLUMN location TEXT;
ALTER TABLE pages ADD COLUMN calendarUrl TEXT;
ALTER TABLE pages ADD COLUMN newsletterUrl TEXT;
ALTER TABLE pages ADD COLUMN tipUrl TEXT;
ALTER TABLE pages ADD COLUMN videoUrl TEXT;
