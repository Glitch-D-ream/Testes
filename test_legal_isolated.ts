
import { jusBrasilAlternative } from './server/integrations/jusbrasil-alternative.ts';
import { initializeDatabase } from './server/core/database.ts';
import { logInfo } from './server/core/logger.ts';
import * as dotenv from 'dotenv';
dotenv.config();

async function runIsolatedTest() {
  console.log('🚀 INICIANDO TESTE ISOLADO DE COLETA JURÍDICA REAL');
  console.log('================================================');
  
  try {
    await initializeDatabase();
    const target = 'Erika Hilton';

    // 1. Testar Querido Diário (Diários Oficiais Municipais)
    console.log(`\n📂 [FASE 1] Consultando Querido Diário para: ${target}...`);
    const gazettes = await jusBrasilAlternative.searchQueridoDiario(target);
    
    if (gazettes.length > 0) {
      console.log(`✅ Sucesso! Encontrados ${gazettes.length} registros em Diários Oficiais.`);
      gazettes.forEach((g, i) => {
        console.log(`\n--- Registro DO [${i+1}] ---`);
        console.log(`Título: ${g.title}`);
        console.log(`Data: ${g.date || 'N/A'}`);
        console.log(`URL: ${g.url}`);
        console.log(`Conteúdo Extraído (Preview): ${g.excerpt.substring(0, 200)}...`);
      });
    } else {
      console.log('⚠️ Nenhum registro encontrado no Querido Diário para este alvo.');
    }

    // 2. Testar Busca Jurídica Pública (Jusbrasil/Escavador/STF)
    console.log(`\n⚖️ [FASE 2] Buscando registros em portais jurídicos para: ${target}...`);
    const legalRecords = await jusBrasilAlternative.searchLegalRecords(target);
    
    if (legalRecords.length > 0) {
      console.log(`✅ Sucesso! Encontrados ${legalRecords.length} registros jurídicos reais.`);
      legalRecords.forEach((r, i) => {
        console.log(`\n--- Registro Jurídico [${i+1}] ---`);
        console.log(`Título: ${r.title}`);
        console.log(`Fonte: ${r.source}`);
        console.log(`URL: ${r.url}`);
        console.log(`Conteúdo Extraído (Preview): ${r.excerpt.substring(0, 200)}...`);
      });
    } else {
      console.log('⚠️ Nenhum registro jurídico encontrado via busca pública.');
    }

    console.log('\n================================================');
    console.log('✅ TESTE ISOLADO CONCLUÍDO');

  } catch (error) {
    console.error('❌ Erro durante o teste isolado:', error);
  }
}

runIsolatedTest();
