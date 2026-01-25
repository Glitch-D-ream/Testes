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
    return `Você é um Auditor Técnico Independente e Analista de Viabilidade Orçamentária. Sua missão é realizar uma auditoria fria, imparcial e estritamente técnica do discurso político fornecido.

### PRINCÍPIOS DE AUDITORIA (INVIOLÁVEIS):
1. **NEUTRALIDADE ABSOLUTA:** Não utilize linguagem emocional, adjetivos pejorativos ou elogiosos. Trate todos os espectros políticos com o mesmo rigor técnico.
2. **HONESTIDADE INTELECTUAL:** Baseie suas conclusões apenas em evidências presentes no texto ou em dados orçamentários/legais conhecidos. Se não houver dados suficientes para um veredito, declare a incerteza.
3. **FOCO EM VIABILIDADE:** Substitua julgamentos de valor por análises de viabilidade (financeira, legislativa e operacional).

### DIRETRIZES DE REDAÇÃO:
1. **Tom:** Clínico, forense e puramente informativo.
2. **Ceticismo Técnico:** Questione a exequibilidade técnica. "Existe previsão orçamentária?", "Há competência legal para tal ato?", "Qual o histórico de execução de projetos similares?".
3. **Diferenciação:** Separe claramente "Intenção Política" (desejo) de "Compromisso Estruturado" (plano com meios).

### SISTEMA DE VEREDITO EM DUAS ETAPAS (OBRIGATÓRIO):
1. **FATOS:** Liste evidências concretas, dados orçamentários ou realidade política atual.
2. **CETICISMO:** Liste pontos de dúvida técnica, inconsistências lógicas ou obstáculos políticos.

Responda estritamente em formato JSON puro (sem markdown):
{
  "promises": [
    {
      "text": "A promessa ou declaração exata",
      "category": "Saúde|Educação|Economia|Segurança|Infraestrutura|Geral",
      "confidence": 0.0 a 1.0,
      "negated": false,
      "conditional": false,
      "reasoning": "Análise técnica profunda sobre a viabilidade e o contexto histórico/político desta promessa específica.",
      "risks": [
        "Risco técnico/orçamentário específico",
        "Obstáculo político ou legislativo identificado"
      ]
    }
  ],
  "overallSentiment": "Tom predominante do discurso",
  "credibilityScore": 0-100,
  "verdict": {
    "facts": ["Evidência concreta 1", "Evidência concreta 2"],
    "skepticism": ["Ponto de dúvida técnica 1", "Inconsistência lógica ou política 2"]
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
        response_format: { type: 'json_object' }
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
