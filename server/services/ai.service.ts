import axios from 'axios';
import { logInfo, logError } from '../core/logger.js';

export interface AIAnalysisResult {
  promises: Array<{
    text: string;
    category: string;
    confidence: number;
    negated: boolean;
    conditional: boolean;
    reasoning: string;
  }>;
  overallSentiment: string;
  credibilityScore: number;
}

export class AIService {
  private promptTemplate(text: string): string {
    return `Você é um analista político especializado em fact-checking e análise técnica de promessas.
    Sua missão é extrair promessas, planos ou compromissos de forma TOTALMENTE IMPARCIAL e RIGOROSA.
    
    DIRETRIZES DE RIGOR:
    1. NEUTRALIDADE: Ignore adjetivos e foque em ações concretas (verbos de ação).
    2. EVIDÊNCIA: Apenas extraia o que está explicitamente no texto. Não deduza intenções.
    3. ESPECIFICIDADE: Diferencie "intenções vagas" de "promessas concretas" (com prazos ou valores).
    4. CETICISMO: Se uma promessa for impossível de ser cumprida apenas pelo executivo, mencione no raciocínio.
    
    Para cada promessa, identifique:
    1. O texto exato da promessa.
    2. A categoria (Saúde, Educação, Economia, etc).
    3. O nível de confiança na extração (0 a 1).
    4. Se a promessa é uma negação (ex: "não vou aumentar impostos").
    5. Se a promessa é condicional (ex: "se eu for eleito").
    6. O raciocínio técnico (justificativa baseada em fatos).
    
    Responda APENAS um JSON no formato:
    {
      "promises": [
        { "text": "string", "category": "string", "confidence": number, "negated": boolean, "conditional": boolean, "reasoning": "string" }
      ],
      "overallSentiment": "Neutral",
      "credibilityScore": number (0 a 100)
    }
    
    Texto para análise:
    ${text}`;
  }

  /**
   * Provedor de Código Aberto (Pollinations AI) com Multi-Model Fallback
   */
  private async analyzeWithOpenSource(text: string): Promise<AIAnalysisResult> {
    const models = ['mistral', 'llama', 'qwen', 'openai'];
    let lastError: any;

    for (const model of models) {
      try {
        logInfo(`[AI] Tentando análise com modelo: ${model}...`);
        const response = await axios.post('https://text.pollinations.ai/', {
          messages: [
            { role: 'system', content: 'Você é um analista político rigoroso. Responda APENAS JSON válido.' },
            { role: 'user', content: this.promptTemplate(text) }
          ],
          model: model,
          jsonMode: true
        }, { timeout: 30000 });

        let content = response.data;
        
        // Extração robusta de JSON
        if (typeof content === 'object' && content.choices) {
          content = content.choices[0]?.message?.content || content;
        }

        if (typeof content === 'string') {
          content = content.replace(/```json\n?|\n?```/g, '').trim();
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) content = jsonMatch[0];
          return JSON.parse(content) as AIAnalysisResult;
        }
        
        if (content && content.promises) return content as AIAnalysisResult;
        
        throw new Error(`Modelo ${model} retornou formato inválido`);
      } catch (error) {
        logError(`[AI] Falha no modelo ${model}`, error as Error);
        lastError = error;
        continue; // Tenta o próximo modelo
      }
    }

    throw lastError || new Error('Todos os modelos de IA falharam');
  }

  /**
   * Fallback para Groq se a chave estiver presente (Llama 3 70B Gratuito)
   */
  private async analyzeWithGroq(text: string): Promise<AIAnalysisResult> {
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY não configurada');
    
    logInfo('Tentando análise com Groq (Llama 3.3 70B)...');
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      messages: [
        { role: 'system', content: 'Você é um analista político que responde apenas em JSON válido.' },
        { role: 'user', content: this.promptTemplate(text) }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const content = response.data.choices[0]?.message?.content;
    if (!content) throw new Error('Resposta vazia do Groq');
    return JSON.parse(content) as AIAnalysisResult;
  }

  async analyzeText(text: string): Promise<AIAnalysisResult> {
    // 1. Tentar Groq (se houver chave, é gratuito e de alto nível)
    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.length > 10) {
      try {
        return await this.analyzeWithGroq(text);
      } catch (error) {
        logError('Falha no Groq, tentando Pollinations...', error as Error);
      }
    }

    // 2. Fallback Final: Pollinations (Sempre disponível e gratuito)
    try {
      return await this.analyzeWithOpenSource(text);
    } catch (error) {
      logError('Falha em todos os provedores de IA', error as Error);
      throw new Error('Não foi possível realizar a análise de IA no momento.');
    }
  }
}

export const aiService = new AIService();
