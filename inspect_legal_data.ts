
import { jusBrasilAlternative } from './server/integrations/jusbrasil-alternative.ts';
import * as dotenv from 'dotenv';
dotenv.config();

async function inspect() {
  console.log('🔍 INSPEÇÃO DE DADOS JURÍDICOS REAIS: ERIKA HILTON');
  console.log('==================================================');

  try {
    const results = await jusBrasilAlternative.searchQueridoDiario('Erika Hilton');
    
    if (results.length === 0) {
      console.log('Nenhum dado encontrado no momento.');
      return;
    }

    results.forEach((r, i) => {
      console.log(`\n--- REGISTRO #${i + 1} ---`);
      console.log(`📌 TÍTULO: ${r.title}`);
      console.log(`🔗 LINK: ${r.url}`);
      console.log(`🏢 FONTE: ${r.source}`);
      console.log(`📝 CONTEÚDO EXTRAÍDO:`);
      console.log(r.excerpt);
      console.log('---------------------------');
    });

  } catch (error) {
    console.error('Erro na inspeção:', error);
  }
}

inspect();
