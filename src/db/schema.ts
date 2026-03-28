import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import type { ThemeConfig } from '@/lib/themes';
import type { ScrapedCache } from '@/lib/scraper';

// ── Page Settings Type ──────────────────────────────────────────────
export type PageSettings = {
  roast?: { tone?: string; context?: string };
  newspaper?: { name?: string; tone?: string; context?: string };
  encyclopedia?: { style?: string; context?: string };
};

// ── Users (extends NextAuth default) ──────────────────────────────────
export const users = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'timestamp' }),
  image: text('image'),
  smProjectId: text('smProjectId'),
  smApiKey: text('smApiKey'),
  smIndexId: text('smIndexId'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(
    () => new Date(),
  ),
});

// ── Accounts (NextAuth) ───────────────────────────────────────────────
export const accounts = sqliteTable('accounts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
});

// ── Sessions (NextAuth) ───────────────────────────────────────────────
export const sessions = sqliteTable('sessions', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
});

// ── Verification Tokens (NextAuth) ───────────────────────────────────
export const verificationTokens = sqliteTable(
  'verificationTokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: integer('expires', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    compositePk: primaryKey({ columns: [table.identifier, table.token] }),
  }),
);

// ── Pages (user profile pages) ───────────────────────────────────────
export const pages = sqliteTable('pages', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull().unique(),
  displayName: text('displayName').notNull(),
  bio: text('bio'),
  avatarUrl: text('avatarUrl'),
  themeConfig: text('themeConfig', { mode: 'json' }).$type<ThemeConfig>(),
  published: integer('published', { mode: 'boolean' }).default(false),
  chatEnabled: integer('chatEnabled', { mode: 'boolean' }).default(false),
  chatSystemPrompt: text('chatSystemPrompt'),
  encyclopediaEnabled: integer('encyclopediaEnabled', { mode: 'boolean' }).default(false),
  roastEnabled: integer('roastEnabled', { mode: 'boolean' }).default(false),
  newspaperEnabled: integer('newspaperEnabled', { mode: 'boolean' }).default(false),
  pageSettings: text('pageSettings', { mode: 'json' }).$type<PageSettings>(),
  scrapedContent: text('scrapedContent', { mode: 'json' }).$type<ScrapedCache>(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).$defaultFn(
    () => new Date(),
  ),
});

// ── Generated Pages (cached AI content) ─────────────────────────────
export const generatedPages = sqliteTable('generatedPages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  pageId: text('pageId').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'encyclopedia' | 'roast' | 'newspaper'
  content: text('content', { mode: 'json' }).$type<Record<string, unknown>>(),
  status: text('status').notNull().default('pending'), // 'pending' | 'generating' | 'ready' | 'error'
  createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ── Links (profile links) ────────────────────────────────────────────
export const links = sqliteTable('links', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  pageId: text('pageId')
    .notNull()
    .references(() => pages.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url').notNull(),
  icon: text('icon'),
  sortOrder: integer('sortOrder').default(0),
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
});

// ── Projects (portfolio entries on a profile) ───────────────────────
export const projects = sqliteTable('projects', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  pageId: text('pageId')
    .notNull()
    .references(() => pages.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url').notNull(),
  imageUrl: text('imageUrl'),
  description: text('description').notNull(),
  sortOrder: integer('sortOrder').default(0),
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
});

// ── Info Blocks (content blocks for AI chat) ─────────────────────────
export const infoBlocks = sqliteTable('infoBlocks', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  pageId: text('pageId')
    .notNull()
    .references(() => pages.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'text' | 'resume' | 'faq'
  title: text('title'),
  content: text('content').notNull(),
  smDocumentId: text('smDocumentId'),
  sortOrder: integer('sortOrder').default(0),
});

// ── Page Sections (modular public blocks) ────────────────────────────
export const pageSections = sqliteTable('pageSections', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  pageId: text('pageId')
    .notNull()
    .references(() => pages.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  content: text('content'),
  buttonLabel: text('buttonLabel'),
  buttonUrl: text('buttonUrl'),
  sortOrder: integer('sortOrder').default(0),
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
});

// ── Contact Submissions (public leads) ───────────────────────────────
export const contactSubmissions = sqliteTable('contactSubmissions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  pageId: text('pageId')
    .notNull()
    .references(() => pages.id, { onDelete: 'cascade' }),
  sectionId: text('sectionId'),
  visitorId: text('visitorId'),
  name: text('name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(
    () => new Date(),
  ),
});

// ── Page Events (native analytics) ───────────────────────────────────
export const pageEvents = sqliteTable('pageEvents', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  pageId: text('pageId')
    .notNull()
    .references(() => pages.id, { onDelete: 'cascade' }),
  visitorId: text('visitorId'),
  eventType: text('eventType').notNull(),
  resourceType: text('resourceType'),
  resourceId: text('resourceId'),
  resourceLabel: text('resourceLabel'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(
    () => new Date(),
  ),
});

// ── Conversations (chat history) ──────────────────────────────────
export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  pageId: text('pageId').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  visitorId: text('visitorId'), // anonymous session ID from client
  createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ── Messages (chat messages) ──────────────────────────────────────
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversationId: text('conversationId').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
