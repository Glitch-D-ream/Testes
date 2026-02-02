import { createClient } from '@supabase/supabase-js';
import { aiResilienceNexus } from '../services/ai-resilience-nexus.ts';

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

    const targetName = analysisContext?.politicianName || analysis.author || 'Alvo Desconhecido';

    console.log('🔍 Fase 1: Qwen 2.5 - Extração e Estruturação...');
    const qwenPrompt = `Você é um assistente de IA especializado em extração e estruturação de dados políticos. Dada a seguinte análise de contexto para o político ${targetName}, extraia as entidades, fatos chave e sentimento geral em formato JSON. Seja conciso e objetivo.

Contexto da Análise:
- Promessas: ${analysisContext?.promisesCount || 0}
- Evidências: ${analysisContext?.evidenceCount || 0}
- Coerência Inicial: ${analysisContext?.coherenceScore || 'N/A'}
- Red Flags: ${analysisContext?.redFlags?.join(', ') || 'Nenhum'}

Formato JSON esperado:
{
  "entities": ["Nome do Político", "Partido (se houver)", "Outras entidades relevantes"],
  "keyFacts": ["Fato 1", "Fato 2"],
  "sentiment": "Positivo|Neutro|Negativo|Alerta"
}
`;
    const qwenResponse = await aiResilienceNexus.chatJSON(qwenPrompt);
    const structuredData = qwenResponse || { entities: [], keyFacts: [], sentiment: 'Não analisado' };

    console.log('🕵️ Fase 2: DeepSeek-R1 - Raciocínio Forense (CoT)...');
    const deepseekPrompt = `Você é um agente de IA especializado em raciocínio forense e análise de coerência política. Dada a seguinte análise estruturada e o contexto original, forneça um veredito conciso e incisivo sobre a coerência e a viabilidade das ações do político ${targetName}. Inclua uma "thought" interna antes do veredito final.

Análise Estruturada (Qwen):
${JSON.stringify(structuredData, null, 2)}

Contexto Original:
- Promessas: ${analysisContext?.promisesCount || 0}
- Evidências: ${analysisContext?.evidenceCount || 0}
- Coerência Inicial: ${analysisContext?.coherenceScore || 'N/A'}
- Red Flags: ${analysisContext?.redFlags?.join(', ') || 'Nenhum'}
- Cargo: ${analysisContext?.office || 'cargo'}
- Estado: ${analysisContext?.state || 'Brasil'}

Seu veredito deve ser uma conclusão lógica baseada nos dados, não um resumo amigável. Se houver incoerências, o tom deve refletir a gravidade.
`;
    const deepseekResponse = await aiResilienceNexus.chat(deepseekPrompt);
    const reasoning = deepseekResponse.content;

    // 3. Salvar veredito no Supabase
    const { error: updateError } = await supabase
      .from('analyses')
      .update({
        ai_verdict_local: {
          qwen_output: structuredData,
          deepseek_reasoning: reasoning,
          processed_at: new Date().toISOString(),
          engine: 'Dual-Chain (GitHub Actions via AI Resilience Nexus)'
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
