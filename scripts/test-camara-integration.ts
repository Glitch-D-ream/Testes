import { getDeputadoId, getVotacoesDeputado, analisarIncoerencia } from '../server/integrations/camara.js';
import * as dotenv from 'dotenv';

dotenv.config();

import { createClient } from '@supabase/supabase-js';
async function test() {
  const politico = 'Erika Hilton'; // Exemplo de político ativo
  console.log(`Testando integração para: ${politico}`);

  // Limpar cache para forçar nova busca
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  await supabase.from('public_data_cache').delete().eq('data_source', `deputado_id_${politico}`);

  const id = await getDeputadoId(politico);
  if (!id) {
    console.log('Deputado não encontrado.');
    return;
  }
  console.log(`ID encontrado: ${id}`);

  const votacoes = await getVotacoesDeputado(id);
  console.log(`Total de votações encontradas: ${votacoes.length}`);

  if (votacoes.length > 0) {
    console.log('Amostra da primeira votação:');
    console.log(votacoes[0]);

    // Testar heurística de incoerência
    const promessaFicticia = "Vou lutar para aumentar o investimento em educação pública";
    const analise = analisarIncoerencia(promessaFicticia, votacoes[0]);
    console.log('\nTeste de Incoerência (Heurística):');
    console.log(`Promessa: "${promessaFicticia}"`);
    console.log(`Resultado: ${analise.incoerente ? 'INCOERENTE' : 'COERENTE'}`);
    if (analise.incoerente) console.log(`Justificativa: ${analise.justificativa}`);
  }
}

test();
