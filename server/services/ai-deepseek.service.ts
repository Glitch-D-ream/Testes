import axios from 'axios';
import { logInfo, logError } from '../core/logger.js';
import { AIAnalysisResult } from './ai.service.js';

/**
 * Protótipo de Integração DeepSeek R1
 * Focado em Raciocínio Profundo para o Veredito em Duas Etapas
 */
export class DeepSeekService {
  private readonly API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly MODEL = 'deepseek/deepseek-r1'; // Ou 'deepseek/deepseek-r1:free' se disponível

  private promptTemplate(text: string): string {
    return `Você é o DeepSeek R1, um modelo de raciocínio profundo especializado em auditoria política.
    Sua missão é realizar uma análise rigorosa, cética e imparcial do texto fornecido.
    
    SISTEMA DE VEREDITO EM DUAS ETAPAS (OBRIGATÓRIO):
    1. FATOS: Liste os dados concretos e a realidade atual mencionada ou relacionada.
    2. CETICISMO: Questione tudo. Por que esta promessa pode falhar? Quais os obstáculos técnicos e políticos?
    
    Para cada promessa, identifique riscos específicos de descumprimento.
    
    Responda estritamente em formato JSON:
    {
      "promises": [
        {
          "text": "Texto da promessa",
          "category": "Categoria",
          "confidence": 0.0-1.0,
          "negated": boolean,
          "conditional": boolean,
          "reasoning": "Raciocínio profundo",
          "risks": ["Risco 1", "Risco 2"]
        }
      ],
      "overallSentiment": "Tom do discurso",
      "credibilityScore": 0-100,
      "verdict": {
        "facts": ["Fato 1"],
        "skepticism": ["Obstáculo 1"]
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
