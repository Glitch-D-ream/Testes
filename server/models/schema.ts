import { pgTable, text, timestamp, boolean, real, varchar, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  role: text('role').default('user'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastLogin: timestamp('last_login'),
  isActive: boolean('is_active').default(true),
});

export const analyses = pgTable('analyses', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  text: text('text').notNull(),
  author: text('author'),
  category: text('category'),
  extractedPromises: jsonb('extracted_promises'),
  probabilityScore: real('probability_score'),
  methodologyNotes: text('methodology_notes'),
  dataSources: jsonb('data_sources'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const promises = pgTable('promises', {
  id: text('id').primaryKey(),
  analysisId: text('analysis_id').references(() => analyses.id).notNull(),
  promiseText: text('promise_text').notNull(),
  category: text('category'),
  confidenceScore: real('confidence_score'),
  extractedEntities: jsonb('extracted_entities'),
  negated: boolean('negated').default(false),
  conditional: boolean('conditional').default(false),
});

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  action: varchar('action', { length: 255 }).notNull(),
  resourceType: varchar('resource_type', { length: 100 }),
  resourceId: text('resource_id'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const consents = pgTable('consents', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  dataProcessing: boolean('data_processing').default(false),
  privacyPolicy: boolean('privacy_policy').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const publicDataCache = pgTable('public_data_cache', {
  id: text('id').primaryKey(),
  dataType: text('data_type').notNull(),
  dataSource: text('data_source').notNull(),
  dataContent: jsonb('data_content').notNull(),
  lastUpdated: timestamp('last_updated').defaultNow(),
  expiryDate: timestamp('expiry_date'),
});
