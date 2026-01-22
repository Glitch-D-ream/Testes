import { nanoid } from 'nanoid';
import { runQuery } from '../server/core/database.js';

const REAL_PROMISES = [
  {
    author: 'Candidato A',
    category: 'EDUCAÇÃO',
    text: 'Vou construir 50 novas escolas de tempo integral em todo o estado até o final do meu mandato.',
    viability: 0.85
  },
  {
    author: 'Candidato B',
    category: 'SAÚDE',
    text: 'Prometo reduzir a fila de espera para cirurgias eletivas em 50% nos primeiros 100 dias de governo.',
    viability: 0.45
  },
  {
    author: 'Candidato C',
    category: 'SEGURANÇA',
    text: 'Iremos contratar 5 mil novos policiais militares e investir 200 milhões em tecnologia de monitoramento.',
    viability: 0.65
  },
  {
    author: 'Candidato D',
    category: 'ECONOMIA',
    text: 'Vou isentar de impostos todas as empresas que contratarem jovens no primeiro emprego.',
    viability: 0.30
  },
  {
    author: 'Candidato E',
    category: 'INFRAESTRUTURA',
    text: 'Vamos pavimentar 100% das estradas rurais da região norte até 2026.',
    viability: 0.55
  }
];

async function seed() {
  console.log('🌱 Iniciando população de dados reais...');

  for (const p of REAL_PROMISES) {
    const analysisId = nanoid();
    
    // Inserir análise
    await runQuery(
      `INSERT INTO analyses (id, text, author, category, probability_score, created_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [analysisId, p.text, p.author, p.category, p.viability]
    );

    // Inserir promessa individual
    await runQuery(
      `INSERT INTO promises (id, analysis_id, promise_text, category, confidence_score)
       VALUES (?, ?, ?, ?, ?)`,
      [nanoid(), analysisId, p.text, p.category, 0.95]
    );

    console.log(`✅ Adicionada promessa de: ${p.author}`);
  }

  console.log('✨ População concluída com sucesso!');
}

seed().catch(console.error);
