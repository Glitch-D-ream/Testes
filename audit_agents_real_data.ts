
import { getDeputadoId, getVotacoesDeputado, getProposicoesDeputado } from './server/integrations/camara.ts';
import { financeService } from './server/services/finance.service.ts';
import { absenceAgent } from './server/agents/absence.ts';
import { initializeDatabase } from './server/core/database.ts';
import * as dotenv from 'dotenv';
dotenv.config();

async function audit() {
  console.log('🔍 AUDITORIA DE DADOS REAIS E ESTADO DOS AGENTES: ERIKA HILTON');
  console.log('==========================================================');
  
  try {
    await initializeDatabase();
    const name = 'Erika Hilton';
    
    // 1. Testar Integração com Câmara (Dados Base)
    console.log('\n1️⃣ Testando Integração Câmara (ID e Votos)...');
    const id = await getDeputadoId(name);
    console.log(`ID encontrado: ${id}`);
    
    if (id) {
      const votacoes = await getVotacoesDeputado(id);
      console.log(`Votações reais encontradas: ${votacoes.length}`);
      if (votacoes.length > 0) {
        console.log(`Exemplo de voto real: ${votacoes[0].proposicao} - Voto: ${votacoes[0].voto}`);
      }
      
      const proposicoes = await getProposicoesDeputado(id);
      console.log(`Proposições (PLs) reais encontradas: ${proposicoes.length}`);
    } else {
      console.log('❌ Falha ao obter ID da Câmara. Verifique conectividade.');
    }

    // 2. Testar Finance Service (Gastos Reais)
    console.log('\n2️⃣ Testando Finance Service (Cota Parlamentar)...');
    if (id) {
      const gastos = await financeService.getParlamentaryExpenses(id, 2024);
      console.log(`Gastos reais (2024) encontrados: ${gastos.length}`);
      if (gastos.length > 0) {
        const total = gastos.reduce((acc, curr) => acc + (curr.value || 0), 0);
        console.log(`Total rastreado em 2024: R$ ${total.toLocaleString('pt-BR')}`);
        console.log(`Exemplo de gasto real: ${gastos[0].description} - R$ ${gastos[0].value}`);
      }
    }

    // 3. Testar Absence Agent (Lógica de Verificação)
    console.log('\n3️⃣ Testando Absence Agent (Verificação de Promessas)...');
    const report = await absenceAgent.checkAbsence('Construir hospital em São Paulo', 'HEALTH');
    console.log(`Status do Agente: ${report.checks.length > 0 ? 'ATIVO' : 'INATIVO'}`);
    console.log(`Score de Viabilidade: ${report.viabilityScore}`);
    console.log(`Sumário: ${report.summary}`);

    // 4. Verificação de Mock vs Real
    console.log('\n4️⃣ Verificação de Integridade (Mock vs Real)...');
    const pixEmendas = await financeService.getPixEmendas(name);
    const isMock = pixEmendas.some(e => e.source.includes('Simulado'));
    console.log(`Dados de Emendas Pix: ${isMock ? '⚠️ SIMULADOS (Aguardando Chave Portal Transparência)' : '✅ REAIS'}`);

  } catch (error) {
    console.error('Erro na auditoria:', error);
  }
}

audit();
