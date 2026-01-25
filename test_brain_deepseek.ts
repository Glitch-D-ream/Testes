
import { brainAgent } from './server/agents/brain.ts';
import { initializeDatabase, getSupabase } from './server/core/database.ts';
import { logInfo } from './server/core/logger.ts';
import dotenv from 'dotenv';

dotenv.config();

async function testBrainDeepSeek() {
  console.log('🚀 Iniciando teste do BrainAgent com DeepSeek R1...');
  
  try {
    // 1. Inicializar Banco
    await initializeDatabase();
    
    // 2. Mock de fontes filtradas
    const mockSources = [
      {
        title: 'Lula promete isenção de IR para quem ganha até R$ 5 mil',
        url: 'https://g1.globo.com/politica/noticia/2024/01/25/lula-promete-isencao-de-ir.ghtml',
        content: 'O presidente Lula reafirmou nesta quinta-feira o compromisso de campanha de isentar do Imposto de Renda quem ganha até R$ 5 mil por mês. "Vou cumprir essa promessa até o fim do meu mandato", disse o presidente.',
        source: 'G1',
        justification: 'Promessa clara de isenção fiscal.'
      }
    ];

    const politicianName = 'Lula';
    const userId = null;
    const analysisId = 'test-analysis-' + Date.now();
    const supabase = getSupabase();

    // Inserção inicial necessária para o BrainAgent poder fazer o update
    await supabase.from('analyses').insert([{
      id: analysisId,
      user_id: userId,
      author: politicianName,
      text: `Análise de teste iniciada para ${politicianName}`,
      status: 'processing'
    }]);

    console.log(`[Test] Analisando promessa para: ${politicianName}`);
    
    // 3. Executar análise (O BrainAgent usará o DeepSeek R1 se a chave estiver no env)
    // Nota: O BrainAgent original não tem limite de tokens, vamos torcer para que o default do OpenRouter funcione ou ajustar o código se necessário.
    await brainAgent.analyze(politicianName, mockSources, userId, analysisId);
    
    console.log('\n✅ Teste do BrainAgent concluído!');
    console.log(`Verifique os resultados no Supabase para a análise ID: ${analysisId}`);
    
  } catch (error: any) {
    console.error('❌ Erro no teste do BrainAgent:', error.message);
    if (error.response?.data) {
      console.error('Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testBrainDeepSeek();
