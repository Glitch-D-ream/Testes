import axios from 'axios';
import { logInfo, logError } from '../core/logger.ts';
import { AIAnalysisResult } from './ai.service.ts';

/**
 * Protótipo de Integração DeepSeek R1
 * Focado em Raciocínio Profundo para o Veredito em Duas Etapas
 */
export class DeepSeekService {
  private readonly API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly MODEL = 'deepseek/deepseek-r1';

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

  async analyzeText(text: string, apiKey: string): Promise<AIAnalysisResult> {
    try {
      logInfo(`[DeepSeek-R1] Iniciando análise de raciocínio profundo...`);
      
      const response = await axios.post(this.API_URL, {
        model: this.MODEL,
        messages: [
          { 
            role: 'system', 
            content: 'Você é um auditor político de elite. Você pensa profundamente antes de responder. Responda apenas JSON.' 
          },
          { role: 'user', content: this.promptTemplate(text) }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/Glitch-D-ream/Testes',
          'X-Title': 'Detector de Promessa Vazia'
        },
        timeout: 90000
      });

      let content = response.data.choices[0].message.content;
      
      if (typeof content === 'string') {
        // Limpar possíveis blocos de código markdown
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          content = JSON.parse(jsonMatch[0]);
        } else {
          content = JSON.parse(content);
        }
      }

      logInfo(`[DeepSeek-R1] Análise concluída com sucesso.`);
      return content as AIAnalysisResult;
    } catch (error) {
      logError(`[DeepSeek-R1] Erro na integração`, error as Error);
      throw new Error('Falha na análise profunda via DeepSeek R1.');
    }
  }
}

export const deepSeekService = new DeepSeekService();
