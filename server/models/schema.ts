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

export const politicians = pgTable('politicians', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  party: varchar('party', { length: 50 }),
  office: varchar('office', { length: 100 }), // Cargo atual
  region: varchar('region', { length: 100 }), // Estado ou Cidade
  tseId: varchar('tse_id', { length: 50 }),
  photoUrl: text('photo_url'),
  bio: text('bio'),
  credibilityScore: real('credibility_score').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const analyses = pgTable('analyses', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  politicianId: text('politician_id').references(() => politicians.id),
  text: text('text').notNull(),
  author: text('author'), // Mantido para compatibilidade ou autores não cadastrados
  category: text('category'),
  extractedPromises: jsonb('extracted_promises'),
  probabilityScore: real('probability_score'),
  methodologyNotes: text('methodology_notes'),
  dataSources: jsonb('data_sources'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  status: varchar('status', { length: 20 }).default('completed'), // 'pending', 'processing', 'completed', 'failed'
  errorMessage: text('error_message'),
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
  evidenceSnippet: text('evidence_snippet'), // O parágrafo original
  sourceUrl: text('source_url'), // Link direto da notícia
  sourceName: varchar('source_name', { length: 100 }), // Ex: G1, Folha
  newsTitle: text('news_title'), // Título da notícia original
  legislativeIncoherence: text('legislative_incoherence'), // Detalhes de incoerência (Diz vs Faz)
  legislativeSourceUrl: text('legislative_source_url'), // Link para a votação oficial
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

export const evidenceStorage = pgTable('evidence_storage', {
  id: text('id').primaryKey(),
  politicianId: text('politician_id').references(() => politicians.id),
  analysisId: text('analysis_id').references(() => analyses.id),
  telegramFileId: text('telegram_file_id').notNull(), // O ID do arquivo no Telegram
  telegramMessageId: text('telegram_message_id'),
  fileType: varchar('file_type', { length: 50 }), // 'image', 'pdf', 'video'
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const auditContributions = pgTable('audit_contributions', {
  id: text('id').primaryKey(),
  promiseId: text('promise_id').references(() => promises.id).notNull(),
  userId: text('user_id').references(() => users.id),
  type: varchar('type', { length: 20 }).notNull(), // 'report_error', 'suggest_source'
  suggestedUrl: text('suggested_url'),
  description: text('description'),
  status: varchar('status', { length: 20 }).default('pending'), // 'pending', 'processed', 'rejected'
  createdAt: timestamp('created_at').defaultNow(),
});

export const scoutHistory = pgTable('scout_history', {
  id: text('id').primaryKey(),
  url: text('url').unique().notNull(),
  title: text('title'),
  content: text('content'),
  source: text('source'),
  politicianName: text('politician_name'),
  publishedAt: timestamp('published_at'),
  analyzed: boolean('analyzed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});
