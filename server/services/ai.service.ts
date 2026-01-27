import axios from 'axios';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { groqService } from './ai-groq.service.ts';
import { deepSeekService } from './ai-deepseek.service.ts';
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
    return `Você é o Núcleo de Inteligência Forense da Seth VII. Sua missão é realizar uma auditoria técnica, FRIA e IMPARCIAL sobre o comportamento de agentes públicos.

DIRETRIZES DE AUDITORIA:
1. POSTURA: Seja clínico. Evite adjetivos emocionais. Foque no GAP (distância) entre o DISCURSO e o FATO.
2. EXTRAÇÃO DE DISCURSO: Identifique citações diretas ou promessas claras. Registre a fonte.
3. IDENTIFICAÇÃO DE CONTRADIÇÕES: Compare o discurso com dados de votação, gastos ou leis.
4. RIGOR: Se não houver evidência clara de contradição, não a invente. Aponte apenas inconsistências lógicas ou factuais.

Responda estritamente em formato JSON:
{
  "promises": [
    {
      "text": "Citação direta ou promessa clara",
      "category": "Saúde|Educação|Economia|Segurança|Infraestrutura|Geral",
      "confidence": 0.0 a 1.0,
      "source_url": "URL da fonte",
      "quote": "Texto original exato",
      "reasoning": "Explicação técnica da inconsistência ou viabilidade.",
      "risks": ["Risco 1", "Risco 2"]
    }
  ],
  "contradictions": [
    {
      "topic": "Assunto da contradição",
      "discourse": {
        "text": "O que o alvo disse",
        "source": "Nome da fonte",
        "url": "URL",
        "date": "Data"
      },
      "reality": {
        "text": "O fato oficial que contradiz",
        "source": "Fonte oficial (Câmara, SICONFI, etc)",
        "url": "URL oficial",
        "date": "Data do fato"
      },
      "gapAnalysis": "Análise fria do desvio entre discurso e fato."
    }
  ],
  "overallSentiment": "Analítico|Factual|Inconsistente",
  "credibilityScore": 0-100,
  "verdict": {
    "facts": ["Fato 1", "Fato 2"],
    "skepticism": ["Dúvida técnica fundamentada"]
  }
}

Texto para análise:
${text}`;
  }

  private async analyzeWithOpenSource(text: string): Promise<AIAnalysisResult> {
    const models = ['mistral', 'llama', 'deepseek-r1', 'llama-3.3-70b', 'mistral-large', 'qwen-qwq'];
    let lastError: any;

    for (const model of models) {
      try {
        logInfo(`[AI] Tentando modelo Pollinations: ${model}...`);
        const response = await axios.post('https://text.pollinations.ai/', {
          messages: [
            { role: 'system', content: 'Você é um analista político sênior. Responda apenas JSON.' },
            { role: 'user', content: this.promptTemplate(text) }
          ],
          model: model,
          jsonMode: true
        }, { timeout: 40000 });

        let content = response.data;
        if (typeof content === 'string') {
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            content = JSON.parse(jsonMatch ? jsonMatch[0] : content);
          } catch (e) {
            logWarn(`[AI] Falha ao parsear JSON do modelo ${model}. Tentando próximo.`);
            continue;
          }
        }

        if (content && (content.promises || content.verdict || content.facts)) {
          return {
            promises: content.promises || [],
            contradictions: content.contradictions || [],
            overallSentiment: content.overallSentiment || 'Informativo',
            credibilityScore: content.credibilityScore || 50,
            verdict: content.verdict || { facts: content.facts || [], skepticism: content.skepticism || [] }
          };
        }
      } catch (error) {
        lastError = error;
        continue;
      }
    }
    throw lastError || new Error('Falha em todos os modelos Pollinations');
  }

  async analyzeText(text: string): Promise<AIAnalysisResult> {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (openRouterKey && !openRouterKey.includes('your-')) {
      const result = await CircuitBreaker.call(
        'DeepSeek-R1',
        () => deepSeekService.analyzeText(text, openRouterKey),
        async () => {
          logWarn(`[AI] DeepSeek R1 falhou ou circuito aberto, tentando Groq...`);
          return null as any;
        }
      );
      if (result) return result;
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && !groqKey.includes('your-')) {
      const result = await CircuitBreaker.call(
        'Groq',
        async () => {
          const completion = await groqService.generateCompletion('Você é um analista político sênior. Responda apenas JSON.', this.promptTemplate(text));
          const jsonMatch = completion.match(/\{[\s\S]*\}/);
          if (jsonMatch) return JSON.parse(jsonMatch[0]) as AIAnalysisResult;
          throw new Error('JSON inválido do Groq');
        },
        async () => {
          logWarn(`[AI] Groq falhou ou circuito aberto, tentando Pollinations...`);
          return null as any;
        }
      );
      if (result) return result;
    }

    return await this.analyzeWithOpenSource(text);
  }

  async generateReport(prompt: string): Promise<string> {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (openRouterKey && !openRouterKey.includes('your-')) {
      const result = await CircuitBreaker.call(
        'DeepSeek-Report',
        async () => {
          logInfo(`[AI] Tentando OpenRouter (DeepSeek) para relatório...`);
          const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'deepseek/deepseek-r1',
            messages: [
              { role: 'system', content: 'Você é o núcleo de inteligência do sistema Seth VII. Auditoria técnica pura.' },
              { role: 'user', content: prompt }
            ]
          }, { 
            headers: { 'Authorization': `Bearer ${openRouterKey}` },
            timeout: 40000 
          });
          return response.data.choices[0].message.content;
        },
        async () => {
          logWarn(`[AI] OpenRouter falhou no relatório, tentando Groq...`);
          return null as any;
        }
      );
      if (result) return result;
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && !groqKey.includes('your-')) {
      const result = await CircuitBreaker.call(
        'Groq-Report',
        async () => groqService.generateCompletion('Você é o núcleo de inteligência do sistema Seth VII. Auditoria técnica pura.', prompt),
        async () => {
          logWarn(`[AI] Groq falhou no relatório, tentando Pollinations...`);
          return null as any;
        }
      );
      if (result) return result;
    }

    const models = ['mistral', 'llama', 'deepseek-r1', 'qwen-qwq', 'mistral-large'];
    for (const model of models) {
      try {
        logInfo(`[AI] Tentando Pollinations (${model}) para relatório final...`);
        const response = await axios.post('https://text.pollinations.ai/', {
          messages: [{ role: 'user', content: prompt }],
          model: model
        }, { timeout: 40000 });
        
        let content = response.data;
        if (content) {
          return typeof content === 'string' ? content : JSON.stringify(content);
        }
      } catch (error) {
        logWarn(`[AI] Modelo ${model} falhou no relatório: ${error}`);
        continue;
      }
    }

    // Fallback de Emergência: Se tudo falhar, retornar o prompt original estruturado minimamente
    logError(`[AI] Todas as APIs de relatório falharam. Usando fallback de texto bruto.`);
    return `PARECER TÉCNICO DE EMERGÊNCIA (FALHA DE IA)\n\nO sistema não conseguiu gerar um relatório formatado devido à instabilidade nas APIs. No entanto, os dados foram coletados.\n\nCONTEÚDO BRUTO DA ANÁLISE:\n${prompt.substring(0, 1000)}...`;
  }
}

export const aiService = new AIService();
