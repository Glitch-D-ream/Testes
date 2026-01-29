
import { ingestionService } from './server/services/ingestion.service.ts';
import { initializeDatabase } from './server/core/database.ts';
import * as dotenv from 'dotenv';
dotenv.config();

const links = [
  "https://noticias.uol.com.br/politica/ultimas-noticias/2023/11/21/lula-condecora-mano-brown-erika-hilton-medalha-ordem-do-merito-cultural.htm",
  "https://congressoemfoco.uol.com.br/area/congresso-nacional/congresso-promulga-emenda-que-permite-acumulo-de-cargos-por-professores/",
  "https://www.cartacapital.com.br/politica/o-plano-do-psol-para-boulos-em-2026-apos-a-derrota-em-sao-paulo/"
];

async function deepInspect() {
  console.log('🔬 INSPEÇÃO PROFUNDA DE CONTEÚDO REAL');
  console.log('====================================');

  try {
    await initializeDatabase();

    for (const url of links) {
      console.log(`\n🌐 Processando: ${url}`);
      const result = await ingestionService.ingest(url, { keywords: ['Erika Hilton', 'medalha', 'projeto', 'lei'] });
      
      if (result) {
        console.log(`✅ Sucesso! Formato: ${result.format}`);
        console.log(`📝 Trecho Útil:\n${result.content.substring(0, 500)}...`);
      } else {
        console.log('❌ Falha ao extrair conteúdo útil.');
      }
      console.log('------------------------------------');
    }

  } catch (error) {
    console.error('Erro na inspeção profunda:', error);
  }
}

deepInspect();
