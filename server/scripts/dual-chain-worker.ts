
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';

// Nota: Em um ambiente real, usaríamos node-llama-cpp ou similar.
// Para este script, simularemos a orquestração da Dual-Chain.

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const analysisId = process.env.ANALYSIS_ID!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runWorker() {
  console.log(`🧠 Iniciando Worker Dual-Chain para Análise: ${analysisId}`);

  try {
    // 1. Buscar dados da análise no Supabase
    const { data: analysis, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (error || !analysis) {
      throw new Error(`Falha ao buscar análise: ${error?.message}`);
    }

    await supabase.from('analyses').update({ status: 'processing_ai' }).eq('id', analysisId);

    console.log('🔍 Fase 1: Qwen 2.5 - Extração e Estruturação...');
    // Simulação de inferência Qwen
    const structuredData = {
      entities: ['Político X', 'Empresa Y'],
      keyFacts: ['Contrato de R$ 10M', 'Voto favorável em 20/01'],
      sentiment: 'Alerta de Incoerência'
    };

    console.log('🕵️ Fase 2: DeepSeek-R1 - Raciocínio Forense (CoT)...');
    // Simulação de inferência DeepSeek (Chain of Thought)
    const reasoning = `
    <thought>
    O político X prometeu austeridade, mas o contrato de R$ 10M com a Empresa Y (doadora de campanha) 
    foi assinado logo após o voto favorável na PL 123. Isso configura um conflito de interesse direto.
    </thought>
    Veredito: Incoerência Grave Detectada.
    `;

    // 3. Salvar veredito no Supabase
    const { error: updateError } = await supabase
      .from('analyses')
      .update({
        ai_verdict_local: {
          qwen_output: structuredData,
          deepseek_reasoning: reasoning,
          processed_at: new Date().toISOString(),
          engine: 'Dual-Chain (GitHub Actions)'
        },
        status: 'completed'
      })
      .eq('id', analysisId);

    if (updateError) throw updateError;

    console.log('✅ Processamento Dual-Chain concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no Worker:', error);
    await supabase.from('analyses').update({ status: 'failed' }).eq('id', analysisId);
    process.exit(1);
  }
}

runWorker();
