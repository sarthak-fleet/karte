-- Pet: a separate image (typically a cartoon character) that roams the
-- public profile page. petUrl null = no pet. petEnabled = visitor opt-in.
ALTER TABLE pages ADD COLUMN petUrl TEXT;
ALTER TABLE pages ADD COLUMN petEnabled INTEGER DEFAULT 1;
