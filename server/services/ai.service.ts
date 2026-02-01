
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
2. PROFUNDIDADE ANALÍTICA: Evite resumos genéricos. Se o dado financeiro for zero, analise o PORQUÊ (falta de transparência, cargo executivo vs legislativo).
3. DESMONTE A RETÓRICA: Identifique "buzzwords" e exponha o que elas escondem.
4. FOCO NO CONFLITO: Identifique onde o discurso do alvo colide com instituições, leis ou fatos econômicos.
5. RIGOR COM FONTES: Use as URLs e citações fornecidas para embasar cada afirmação.
6. VEREDITO INCISIVO: O veredito deve ser uma conclusão lógica baseada nos dados, não um resumo amigável. Se houver 100% de risco de incoerência, o tom deve refletir a gravidade.

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

  /**
   * OTIMIZAÇÃO v4.0: Model Tiering
   * Tenta modelos ultra-rápidos (Flash) primeiro para ganhar velocidade.
   */
  async analyzeText(text: string): Promise<AIAnalysisResult> {
    logInfo(`[AI] Iniciando análise de texto (Tiering Mode)...`);

    // 1. Tentar modelos Flash (Ultra-rápidos) via Nexo de Resiliência
    try {
      logInfo(`[AI] Camada 1: Tentando modelos Flash (Velocidade Máxima)...`);
      const { aiResilienceNexus } = await import('./ai-resilience-nexus.ts');
      // Forçamos o uso de modelos leves como Llama-3-8B ou Mistral
      const response = await aiResilienceNexus.chat(this.promptTemplate(text) + "\nUSE_MODEL: openai");
      return normalizationService.normalizeAIOutput(response.content);
    } catch (e) { 
      logWarn(`[AI] Camada 1 falhou. Recorrendo à Camada 2 (Raciocínio Profundo)...`); 
    }

    // 2. Tentar Gemini Service (Motor de Raciocínio Profundo)
    try {
      return await geminiService.analyzeText(text, this.promptTemplate.bind(this));
    } catch (e) { 
      logWarn(`[AI] Camada 2 falhou. Tentando fallbacks finais...`); 
    }

    // 3. Fallback Final: Nexo de Resiliência Global (Cascata Completa)
    const { aiResilienceNexus } = await import('./ai-resilience-nexus.ts');
    const finalResponse = await aiResilienceNexus.chat(this.promptTemplate(text));
    return normalizationService.normalizeAIOutput(finalResponse.content);
  }

  async generateReport(prompt: string): Promise<string> {
    try {
      // Prioridade para velocidade no relatório também
      const { aiResilienceNexus } = await import('./ai-resilience-nexus.ts');
      const response = await aiResilienceNexus.chat(prompt + "\nUSE_MODEL: openai");
      return response.content;
    } catch (e) { 
      logWarn(`[AI] Falha no relatório rápido. Usando Gemini...`);
      return await geminiService.generateCompletion(prompt).catch(() => "Erro na geração de relatório.");
    }
  }
}

export const aiService = new AIService();
