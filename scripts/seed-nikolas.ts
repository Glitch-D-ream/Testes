
import { runQuery, initializeDatabase } from '../server/core/database.js';
import { nanoid } from 'nanoid';
import dotenv from 'dotenv';

dotenv.config();

async function seedNikolas() {
  console.log('Iniciando banco de dados...');
  await initializeDatabase();

  console.log('Populando dados do Nikolas Ferreira...');
  
  const id = nanoid();
  const name = 'Nikolas Ferreira';
  const party = 'PL';
  const office = 'Deputado Federal';
  const region = 'MG';
  const tseId = '209787';
  const photoUrl = 'https://www.camara.leg.br/internet/deputado/bandep/209787.jpg';
  const bio = 'Deputado Federal mais votado do Brasil em 2022. Natural de Belo Horizonte, Minas Gerais.';
  const credibilityScore = 85;

  try {
    // Primeiro garantir que a tabela existe (caso não tenha sido criada pelo initializeDatabase)
    await runQuery(`
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await runQuery(
      'INSERT INTO politicians (id, name, party, office, region, tse_id, photo_url, bio, credibility_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, party, office, region, tseId, photoUrl, bio, credibilityScore]
    );
    console.log('✅ Nikolas Ferreira cadastrado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao cadastrar:', error);
  }
}

seedNikolas().catch(console.error);
