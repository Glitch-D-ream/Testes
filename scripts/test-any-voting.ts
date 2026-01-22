
import axios from 'axios';

async function testAnyVoting() {
  console.log('--- Buscando Votações Recentes da Câmara ---');
  try {
    const resp = await axios.get('https://dadosabertos.camara.leg.br/api/v2/votacoes', {
      params: { ordem: 'DESC', ordenarPor: 'dataHoraRegistro' }
    });
    
    const votacoes = resp.data.dados.slice(0, 3);
    for (const v of votacoes) {
      console.log(`\nVotação: ${v.id} - ${v.dataHoraRegistro}`);
      console.log(`Tema: ${v.proposicaoObjeto}`);
      
      const votosResp = await axios.get(`https://dadosabertos.camara.leg.br/api/v2/votacoes/${v.id}/votos`);
      const totalVotos = votosResp.data.dados.length;
      console.log(`Total de votos registrados: ${totalVotos}`);
      
      if (totalVotos > 0) {
        const exemplo = votosResp.data.dados[0];
        console.log(`Exemplo de voto: ${exemplo.deputado.nome} (${exemplo.deputado.siglaPartido}) votou "${exemplo.tipoVoto}"`);
      }
    }
  } catch (e: any) {
    console.error('Erro:', e.message);
  }
}

testAnyVoting().catch(console.error);
