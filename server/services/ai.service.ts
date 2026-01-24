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
    return `Você é um analista político especializado em fact-checking e análise de promessas. 
    Analise o texto fornecido e extraia todas as promessas políticas.
    Para cada promessa, identifique:
    1. O texto exato da promessa.
    2. A categoria (Saúde, Educação, Infraestrutura, Economia, etc).
    3. Score de confiança (0-1) de que isso é realmente uma promessa.
    4. Se é uma promessa negativa (ex: "não vou fazer").
    5. Se é uma promessa condicional (ex: "se eu ganhar").
    6. Uma breve explicação do raciocínio.
    
    Também forneça um sentimento geral do texto e um score de credibilidade inicial (0-100).
    Responda estritamente em formato JSON seguindo esta estrutura:
    {
      "promises": [
        {
          "text": "string",
          "category": "string",
          "confidence": number,
          "negated": boolean,
          "conditional": boolean,
          "reasoning": "string"
        }
      ],
      "overallSentiment": "string",
      "credibilityScore": number
    }
    
    Texto para análise:
    ${text}`;
  }

  /**
   * Provedor de Código Aberto (Pollinations AI) - Gratuito e sem necessidade de chave
   */
  private async analyzeWithOpenSource(text: string): Promise<AIAnalysisResult> {
    logInfo('Iniciando análise com Provedor Open Source (Pollinations)...');
    
    try {
      const response = await axios.post('https://text.pollinations.ai/', {
        messages: [
          { role: 'system', content: 'Você é um analista político que responde apenas em JSON válido.' },
          { role: 'user', content: this.promptTemplate(text) }
        ],
        model: 'openai'
      }, { timeout: 45000 });

      let content = response.data;
      if (typeof content === 'string') {
        // Limpar possíveis markdown blocks
        content = content.replace(/```json\n?|\n?```/g, '').trim();
        // Tentar encontrar o JSON se houver texto extra
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          content = jsonMatch[0];
        }
        return JSON.parse(content) as AIAnalysisResult;
      }
      return content as AIAnalysisResult;
    } catch (error) {
      logError('Falha no Provedor Open Source', error as Error);
      throw error;
    }
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
