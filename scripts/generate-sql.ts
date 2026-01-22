
import { pgTable, text, timestamp, boolean, real, varchar, jsonb } from 'drizzle-orm/pg-core';
import * as schema from '../server/models/schema.js';

// Este script é apenas uma referência para gerar o SQL manualmente se necessário
// Já que o drizzle-kit push falhou por DNS, vamos gerar o SQL e tentar executar via SDK

console.log('-- SQL para criação de tabelas no Supabase');
console.log('-- Gerado automaticamente para migração');

const tables = [
  'users', 'politicians', 'analyses', 'promises', 'audit_logs', 
  'consents', 'public_data_cache', 'evidence_storage', 'refresh_tokens'
];

// SQL manual baseado no schema.ts
const sql = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS politicians (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  party VARCHAR(50),
  office VARCHAR(100),
  region VARCHAR(100),
  tse_id VARCHAR(50),
  photo_url TEXT,
  bio TEXT,
  credibility_score REAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  politician_id TEXT REFERENCES politicians(id),
  text TEXT NOT NULL,
  author TEXT,
  category TEXT,
  extracted_promises JSONB,
  probability_score REAL,
  methodology_notes TEXT,
  data_sources JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promises (
  id TEXT PRIMARY KEY,
  analysis_id TEXT REFERENCES analyses(id) NOT NULL,
  promise_text TEXT NOT NULL,
  category TEXT,
  confidence_score REAL,
  extracted_entities JSONB,
  negated BOOLEAN DEFAULT FALSE,
  conditional BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consents (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) NOT NULL,
  data_processing BOOLEAN DEFAULT FALSE,
  privacy_policy BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public_data_cache (
  id TEXT PRIMARY KEY,
  data_type TEXT NOT NULL,
  data_source TEXT NOT NULL,
  data_content JSONB NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS evidence_storage (
  id TEXT PRIMARY KEY,
  politician_id TEXT REFERENCES politicians(id),
  analysis_id TEXT REFERENCES analyses(id),
  telegram_file_id TEXT NOT NULL,
  telegram_message_id TEXT,
  file_type VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

console.log(sql);
