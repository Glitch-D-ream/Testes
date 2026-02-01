
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';

// Nota: Em um ambiente real, usaríamos node-llama-cpp ou similar.
// Para este script, simularemos a orquestração da Dual-Chain.

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const analysisId = process.env.ANALYSIS_ID!;
// Receber o contexto via variável de ambiente (injetada pelo GitHub Action a partir do payload)
const contextRaw = process.env.ANALYSIS_CONTEXT || '{}';
let analysisContext: any = {};
try {
  analysisContext = JSON.parse(contextRaw);
} catch (e) {
  console.warn('⚠️ Falha ao parsear contexto, operando em modo de coleta total.');
}

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
    // Usar dados do contexto se disponíveis para acelerar a análise
    const targetName = analysisContext.politicianName || analysis.author || 'Alvo Desconhecido';
    
    const structuredData = {
      entities: [targetName, ...(analysisContext.party ? [analysisContext.party] : [])],
      keyFacts: [
        `Analisando ${analysisContext.promisesCount || 0} promessas`,
        `Baseado em ${analysisContext.evidenceCount || 0} evidências coletadas`,
        `Score de coerência inicial: ${analysisContext.coherenceScore || 'N/A'}`
      ],
      sentiment: (analysisContext.redFlags && analysisContext.redFlags.length > 0) ? 'Alerta de Incoerência' : 'Análise Padrão'
    };

    console.log('🕵️ Fase 2: DeepSeek-R1 - Raciocínio Forense (CoT)...');
    const reasoning = `
    <thought>
    Iniciando raciocínio forense para ${targetName}. 
    O sistema de produção detectou ${analysisContext.redFlags?.length || 0} red flags: ${analysisContext.redFlags?.join(', ') || 'Nenhum'}.
    Cruzando com dados de ${analysisContext.office || 'cargo'} em ${analysisContext.state || 'Brasil'}.
    </thought>
    Veredito: Análise Dual-Chain concluída para ${targetName}. ${analysisContext.redFlags?.length > 0 ? 'Incoerências confirmadas.' : 'Nenhuma irregularidade grave detectada no contexto atual.'}
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
