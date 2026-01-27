import axios from 'axios';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { groqService } from './ai-groq.service.ts';
import { deepSeekService } from './ai-deepseek.service.ts';

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
    return `Você é o Auditor-Chefe da Seth VII, especializado em análise de risco político e viabilidade fiscal. Sua missão é dissecar o texto fornecido e extrair inteligência acionável.

DIRETRIZES DE AUDITORIA:
1. EXTRAÇÃO DE INTENÇÕES: Identifique não apenas promessas diretas, mas intenções políticas claras, projetos mencionados ou posicionamentos fortes.
2. ANÁLISE DE RISCO: Para cada item, identifique por que ele pode falhar (falta de verba, oposição política, entraves jurídicos).
3. VEREDITO TÉCNICO: Use seu raciocínio profundo para avaliar se o que está sendo dito tem pé no chão ou é apenas retórica.
4. RESILIÊNCIA: Se o texto for vago, extraia a "Tendência de Atuação" do político.

Responda estritamente em formato JSON:
{
  "promises": [
    {
      "text": "A promessa ou intenção clara",
      "category": "Saúde|Educação|Economia|Segurança|Infraestrutura|Geral",
      "estimatedValue": 0, 
      "confidence": 0.0 a 1.0,
      "negated": false,
      "conditional": false,
      "reasoning": "Análise técnica detalhada sobre a viabilidade.",
      "risks": ["Risco técnico 1", "Risco político 2"]
    }
  ],
  "overallSentiment": "Técnico|Populista|Informativo|Oportunista",
  "credibilityScore": 0-100,
  "verdict": {
    "facts": ["Fato principal identificado"],
    "skepticism": ["Obstáculo crítico para o sucesso do político"]
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
        }, { timeout: 20000 });

        let content = response.data;
        if (typeof content === 'string') {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          content = JSON.parse(jsonMatch ? jsonMatch[0] : content);
        }

        if (content && (content.promises || content.verdict)) {
          return {
            promises: content.promises || [],
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
    throw lastError || new Error('Falha em todos os modelos Pollinations');
  }

  async analyzeText(text: string): Promise<AIAnalysisResult> {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (openRouterKey && !openRouterKey.includes('your-')) {
      try {
        return await deepSeekService.analyzeText(text, openRouterKey);
      } catch (error) {
        logWarn(`[AI] DeepSeek R1 falhou, tentando Groq...`);
      }
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && !groqKey.includes('your-')) {
      try {
        const result = await groqService.generateCompletion('Você é um analista político sênior. Responda apenas JSON.', this.promptTemplate(text));
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as AIAnalysisResult;
        }
      } catch (error) {
        logWarn(`[AI] Groq falhou, tentando Pollinations...`);
      }
    }

    return await this.analyzeWithOpenSource(text);
  }

  async generateReport(prompt: string): Promise<string> {
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && !groqKey.includes('your-')) {
      try {
        return await groqService.generateCompletion('Você é o núcleo de inteligência do sistema Seth VII. Auditoria técnica pura.', prompt);
      } catch (error) {
        logWarn(`[AI] Groq falhou no relatório, tentando Pollinations...`);
      }
    }

    const models = ['mistral', 'llama', 'deepseek-r1'];
    for (const model of models) {
      try {
        const response = await axios.post('https://text.pollinations.ai/', {
          messages: [{ role: 'user', content: prompt }],
          model: model
        }, { timeout: 20000 });
        if (response.data) return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      } catch (error) {
        continue;
      }
    }
    throw new Error('Falha ao gerar relatório profissional');
  }
}

export const aiService = new AIService();
