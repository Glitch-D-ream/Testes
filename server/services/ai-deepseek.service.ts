import axios from 'axios';
import { logInfo, logError } from '../core/logger.ts';
import { AIAnalysisResult } from './ai.service.ts';

/**
 * Protótipo de Integração DeepSeek R1
 * Focado em Raciocínio Profundo para o Veredito em Duas Etapas
 */
export class DeepSeekService {
  private readonly API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly MODEL = 'deepseek/deepseek-r1'; // Ou 'deepseek/deepseek-r1:free' se disponível

  private promptTemplate(text: string): string {
    return `Você é um Auditor Técnico Independente e Analista de Viabilidade Orçamentária da Seth VII. Sua missão é realizar uma auditoria fria, imparcial e estritamente técnica do conteúdo fornecido.

### O QUE É UMA PROMESSA (CRITÉRIO RIGOROSO):
- **SIM:** "Vou construir 50 escolas até 2026", "Anunciamos investimento de 10 bi na saúde", "Votarei contra o aumento de impostos".
- **NÃO:** Notícias sobre o político ("Lula viaja para a China"), ataques a adversários ("Fulano é fascista"), descrições de eventos passados sem compromisso futuro.

### PRINCÍPIOS DE AUDITORIA:
1. **FILTRAGEM DE RUÍDO:** Ignore ataques políticos, fofocas de bastidores ou notícias puramente informativas que não contenham um compromisso de ação futura.
2. **HONESTIDADE INTELECTUAL:** Se o texto for apenas uma notícia sem promessas, a lista "promises" deve estar VAZIA [].
3. **FOCO EM VIABILIDADE:** Analise se a promessa tem base orçamentária ou se é apenas retórica eleitoral.

### SISTEMA DE VEREDITO EM DUAS ETAPAS:
1. **FATOS:** Liste apenas dados concretos e compromissos reais identificados.
2. **CETICISMO:** Liste os obstáculos reais (Teto de Gastos, LRF, Oposição no Congresso).

Responda estritamente em formato JSON puro:
{
  "promises": [
    {
      "text": "A promessa exata (ex: 'Vou reduzir o IPI')",
      "category": "Saúde|Educação|Economia|Segurança|Infraestrutura|Geral",
      "estimatedValue": 0, 
      "confidence": 0.0 a 1.0,
      "negated": false,
      "conditional": false,
      "reasoning": "Por que isso é viável ou inviável? Cite leis ou orçamento se possível.",
      "risks": ["Risco 1", "Risco 2"]
    }
  ],
  "overallSentiment": "Técnico|Populista|Informativo",
  "credibilityScore": 0-100,
  "verdict": {
    "facts": ["Fato concreto extraído"],
    "skepticism": ["Obstáculo técnico identificado"]
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
          'HTTP-Referer': 'https://github.com/Glitch-D-ream/Testes', // Opcional para OpenRouter
          'X-Title': 'Detector de Promessa Vazia'
        },
        timeout: 90000 // DeepSeek R1 pode demorar mais para "pensar"
      });

      let content = response.data.choices[0].message.content;
      
      if (typeof content === 'string') {
        content = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
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
