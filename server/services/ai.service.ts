
import axios from 'axios';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { groqService } from './ai-groq.service.ts';
import { deepSeekService } from './ai-deepseek.service.ts';
import { geminiService } from './ai-gemini.service.ts';
import { normalizationService } from './normalization.service.ts';
import { CircuitBreaker } from '../core/circuit-breaker.ts';

export interface AIAnalysisResult {
  promises: Array<{
    text: string;
    category: string;
    confidence: number;
    negated: boolean;
    conditional: boolean;
    reasoning: string;
    risks: string[];
    source_url?: string;
    quote?: string;
  }>;
  contradictions: Array<{
    topic: string;
    discourse: any;
    reality: any;
    gapAnalysis: string;
  }>;
  overallSentiment: string;
  credibilityScore: number;
  verdict: {
    facts: string[];
    skepticism: string[];
  };
}

export class AIService {
  private promptTemplate(text: string): string {
    return `VOCÊ É O NÚCLEO DE INTELIGÊNCIA FORENSE DA SETH VII.
Sua missão é realizar uma auditoria técnica, FRIA, CLÍNICA e ADVERSARIAL. Você não é um assistente, você é um AUDITOR FORENSE.

DIRETRIZES DE AUDITORIA (CRÍTICO):
1. MODO ADVERSARIAL: Não aceite declarações políticas pelo seu valor nominal. Procure ativamente por contradições, populismo, dogmatismo e radicalismo.
2. ZERO TOLERÂNCIA PARA ALUCINAÇÃO: Proibido inventar URLs ou fatos. Se não houver evidência no texto fornecido, responda "EVIDÊNCIA NÃO ENCONTRADA".
3. DESMONTE A RETÓRICA: Políticos de alto perfil usam "buzzwords" para esconder a falta de planos concretos. Identifique e exponha essa técnica.
4. FOCO NO CONFLITO: Identifique onde o discurso do alvo colide com instituições, leis ou fatos econômicos.
5. RIGOR COM FONTES: Use apenas as URLs e citações presentes no texto de entrada.

Responda APENAS em formato JSON válido:
{
  "promises": [
    {
      "text": "Promessa ou declaração específica",
      "category": "Saúde|Educação|Economia|Segurança|Infraestrutura|Geral",
      "confidence": 0.0 a 1.0,
      "source_url": "URL real da fonte fornecida",
      "quote": "Texto original exato",
      "reasoning": "Por que esta promessa é vaga ou inconsistente com a realidade?",
      "risks": ["Risco técnico ou fiscal"]
    }
  ],
  "contradictions": [
    {
      "topic": "Assunto",
      "discourse": {"text": "O que o alvo disse", "source": "Fonte", "url": "URL"},
      "reality": {"text": "O fato oficial", "source": "Fonte oficial", "url": "URL"},
      "gapAnalysis": "Análise técnica do desvio."
    }
  ],
  "overallSentiment": "Analítico|Inconsistente|Crítico",
  "credibilityScore": 0-100,
  "verdict": {
    "facts": ["Fato comprovado 1", "Fato comprovado 2"],
    "skepticism": ["Por que devemos duvidar desta declaração baseando-se nos dados?"]
  }
}

TEXTO PARA AUDITORIA:
${text}`;
  }

  private async analyzeWithOpenSource(text: string): Promise<AIAnalysisResult> {
    const models = ['deepseek-r1', 'llama-3.3-70b', 'qwen-qwq', 'mistral-large'];
    let lastError: any;

    for (const model of models) {
      try {
        logInfo(`[AI] Tentando modelo Pollinations: ${model}...`);
        const response = await axios.post('https://text.pollinations.ai/', {
          messages: [
            { role: 'system', content: 'Você é um auditor forense político. Responda apenas JSON.' },
            { role: 'user', content: this.promptTemplate(text) }
          ],
          model: model,
          jsonMode: true
        }, { timeout: 45000 });

        let content = response.data;
        if (typeof content === 'string') {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          content = JSON.parse(jsonMatch ? jsonMatch[0] : content);
        }

        if (content && (content.promises || content.verdict)) {
          return {
            promises: content.promises || [],
            contradictions: content.contradictions || [],
            overallSentiment: content.overallSentiment || 'Informativo',
            credibilityScore: content.credibilityScore || 50,
            verdict: content.verdict || { facts: [], skepticism: [] }
          };
        }
      } catch (error) {
        lastError = error;
        continue;
      }
    }
    throw lastError || new Error('Falha em todos os modelos gratuitos');
  }

  async analyzeText(text: string): Promise<AIAnalysisResult> {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // 1. Tentar Gemini Service (Motor Principal v3.2)
    // Reduzimos o tempo de espera para o Gemini para não travar o frontend
    try {
      const geminiPromise = geminiService.analyzeText(text, this.promptTemplate.bind(this));
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini Timeout')), 15000));
      return await Promise.race([geminiPromise, timeoutPromise]) as AIAnalysisResult;
    } catch (e) { 
      logWarn(`[AI] Gemini Service falhou ou demorou demais. Tentando fallbacks rápidos...`); 
    }

    // 2. Tentar GLM-4.7 (China - Alta Velocidade e Gratuito)
    try {
      logInfo(`[AI] Tentando GLM-4.7-Flash (Prioridade de Velocidade)...`);
      const { aiResilienceNexus } = await import('./ai-resilience-nexus.ts');
      return await aiResilienceNexus.chatJSON<AIAnalysisResult>(text + "\nUSE_MODEL: glm-4");
    } catch (e) { 
      logWarn(`[AI] GLM-4.7 falhou. Tentando outros fallbacks...`); 
    }

    // 3. Tentar Groq (Alta Velocidade)
    if (groqKey && !groqKey.includes('your-')) {
      try {
        const completion = await groqService.generateCompletion('Auditor forense. JSON apenas.', this.promptTemplate(text));
        return normalizationService.normalizeAIOutput(completion);
      } catch (e) { logWarn(`[AI] Groq falhou...`); }
    }

    // 4. Fallback Final: Nexo de Resiliência Global (Cascata Completa)
    logInfo(`[AI] Ativando Nexo de Resiliência Global...`);
    const { aiResilienceNexus } = await import('./ai-resilience-nexus.ts');
    return await aiResilienceNexus.chatJSON<AIAnalysisResult>(text);
  }

  async generateReport(prompt: string): Promise<string> {
    // 1. Tentar Gemini Service para relatórios
    try {
      return await geminiService.generateCompletion(prompt);
    } catch (e) { 
      logWarn(`[AI] Gemini Service falhou no relatório. Tentando fallbacks...`); 
    }

    // 2. Fallback para Nexo de Resiliência
    try {
      logInfo(`[AI] Gerando relatório via Nexo de Resiliência...`);
      const { aiResilienceNexus } = await import('./ai-resilience-nexus.ts');
      const response = await aiResilienceNexus.chat(prompt);
      return response.content;
    } catch (e) {
      return `FALHA NA GERAÇÃO DE IA. DADOS BRUTOS: ${prompt.substring(0, 500)}`;
    }
  }
}

export const aiService = new AIService();
