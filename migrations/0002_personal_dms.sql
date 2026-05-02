ALTER TABLE "pages" ADD COLUMN "dmMode" TEXT NOT NULL DEFAULT 'off';
ALTER TABLE "contactSubmissions" ADD COLUMN "senderType" TEXT NOT NULL DEFAULT 'email';
ALTER TABLE "contactSubmissions" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'unread';
