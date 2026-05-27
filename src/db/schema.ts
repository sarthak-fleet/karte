import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import type { ScrapedCache } from '@/lib/scraper';
import type { ThemeConfig } from '@/lib/themes';

// ── Page Settings Type ──────────────────────────────────────────────
export type PageSettings = {
  visitorIntent?: 'explore' | 'ask' | 'reach' | 'vibe';
  roast?: { tone?: string; context?: string };
  newspaper?: { name?: string; tone?: string; context?: string };
  encyclopedia?: { style?: string; context?: string };
};

export type DmMode = 'off' | 'anonymous' | 'email';

// ── User (better-auth default + linkchat custom fields) ──────────────
// Table name `user` (singular) — matches better-auth defaults so its
// drizzleAdapter resolves without a custom schema mapping.
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'boolean' })
    .notNull()
    .default(false),
  image: text('image'),
  // linkchat-specific user settings
  smProjectId: text('smProjectId'),
  smApiKey: text('smApiKey'),
  smIndexId: text('smIndexId'),
  aiEndpointUrl: text('aiEndpointUrl'),
  aiApiKey: text('aiApiKey'),
  aiModel: text('aiModel'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

// Backward-compat alias — many call sites still import `users`.
// New code should prefer `user`.
export const users = user;

// ── Account (better-auth) ────────────────────────────────────────────
export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refreshTokenExpiresAt', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

// ── Session (better-auth) ────────────────────────────────────────────
export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

// ── Verification (better-auth) ───────────────────────────────────────
export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }),
});

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
  dmMode: text('dmMode').$type<DmMode>().notNull().default('off'),
  encyclopediaEnabled: integer('encyclopediaEnabled', { mode: 'boolean' }).default(false),
  roastEnabled: integer('roastEnabled', { mode: 'boolean' }).default(false),
  newspaperEnabled: integer('newspaperEnabled', { mode: 'boolean' }).default(false),
  pageSettings: text('pageSettings', { mode: 'json' }).$type<PageSettings>(),
  scrapedContent: text('scrapedContent', { mode: 'json' }).$type<ScrapedCache>(),
  // Quick-action fields. All nullable; surfaced on the public profile only
  // when set. Pure URL/text — no integrations, just well-rendered links.
  location: text('location'),
  calendarUrl: text('calendarUrl'),
  newsletterUrl: text('newsletterUrl'),
  tipUrl: text('tipUrl'),
  videoUrl: text('videoUrl'),
  // Roaming pet: a cartoon image that walks across the profile and
  // pops up with AI-generated lines. Separate from avatarUrl so the
  // user can keep a real photo as the avatar and a character as pet.
  petUrl: text('petUrl'),
  petEnabled: integer('petEnabled', { mode: 'boolean' }).default(true),
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
  // Optional richer content — unlocks the wider link variants. Nullable so
  // existing links keep their compact line treatment until backfilled.
  imageUrl: text('imageUrl'),
  body: text('body'),
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
  senderType: text('senderType').$type<'anonymous' | 'email'>().notNull().default('email'),
  status: text('status').$type<'unread' | 'replied' | 'archived'>().notNull().default('unread'),
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

// ── Daily Aggregates (durable analytics) ─────────────────────────────
export const dailyStats = sqliteTable('dailyStats', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  pageId: text('pageId').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // YYYY-MM-DD
  eventType: text('eventType').notNull(),
  count: integer('count').notNull().default(0),
  visitors: integer('visitors').notNull().default(0),
});

export const dailyResourceStats = sqliteTable('dailyResourceStats', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  pageId: text('pageId').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // YYYY-MM-DD
  eventType: text('eventType').notNull(),
  resourceType: text('resourceType').notNull(),
  resourceId: text('resourceId').notNull(),
  resourceLabel: text('resourceLabel'),
  count: integer('count').notNull().default(0),
  visitors: integer('visitors').notNull().default(0),
});

// ── Duplicate-tolerant helper ────────────────────────────────────────
export const dailyVisitorEvents = sqliteTable('dailyVisitorEvents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  pageId: text('pageId').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  visitorId: text('visitorId').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  eventType: text('eventType').notNull(),
  resourceId: text('resourceId'), // Optional, for resource-specific uniques
});

// ── Page Domains (custom domains mapped to pages) ─────────────────
export type PageDomainStatus = 'pending' | 'verifying' | 'verified' | 'error';
export type PageDomainVerification = {
  type: string;
  domain: string;
  value: string;
  reason?: string;
};

export const pageDomains = sqliteTable('pageDomains', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  pageId: text('pageId')
    .notNull()
    .references(() => pages.id, { onDelete: 'cascade' }),
  hostname: text('hostname').notNull().unique(),
  status: text('status').$type<PageDomainStatus>().notNull().default('pending'),
  isPrimary: integer('isPrimary', { mode: 'boolean' }).notNull().default(false),
  verification: text('verification', { mode: 'json' }).$type<PageDomainVerification[]>(),
  errorMessage: text('errorMessage'),
  lastCheckedAt: integer('lastCheckedAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).$defaultFn(
    () => new Date(),
  ),
});

// ── Conversations (chat history) ──────────────────────────────────
export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  pageId: text('pageId').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  visitorId: text('visitorId'), // anonymous session ID from client
  // Email captured from the visitor before they could send a chat message.
  // Nullable for backwards compat — pre-existing conversations have no email.
  visitorEmail: text('visitorEmail'),
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
