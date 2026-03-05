import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

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
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionToken: text('sessionToken').notNull().unique(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
});

// ── Verification Tokens (NextAuth) ───────────────────────────────────
export const verificationTokens = sqliteTable('verificationTokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
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
  themeConfig: text('themeConfig', { mode: 'json' }).$type<{
    gradientFrom?: string;
    gradientTo?: string;
    accentColor?: string;
  }>(),
  published: integer('published', { mode: 'boolean' }).default(false),
  chatEnabled: integer('chatEnabled', { mode: 'boolean' }).default(false),
  chatSystemPrompt: text('chatSystemPrompt'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).$defaultFn(
    () => new Date(),
  ),
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
  sortOrder: integer('sortOrder').default(0),
});
