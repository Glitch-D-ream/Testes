
import { jusBrasilAlternative } from './server/integrations/jusbrasil-alternative.ts';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log('🌐 TESTANDO QUERIDO DIÁRIO VIA BROWSER');
  const target = 'Erika Hilton';

  try {
    const gazettes = await jusBrasilAlternative.searchQueridoDiario(target);
    console.log(`\n✅ Resultado: ${gazettes.length} registros encontrados.`);
    gazettes.forEach((g, i) => {
      console.log(`[${i+1}] ${g.title} - ${g.url}`);
    });
  } catch (error) {
    console.error('❌ Erro no teste de browser:', error);
  }
}

test();
