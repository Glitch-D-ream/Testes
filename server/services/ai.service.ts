import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import OpenAI from 'openai';
import axios from 'axios';
import { logInfo, logError } from '../core/logger.js';

// Configuração dos Provedores
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY || '',
});

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
   * Provedor de Código Aberto (Pollinations AI) - Gratuito e sem necessidade de chave complexa
   */
  private async analyzeWithOpenSource(text: string): Promise<AIAnalysisResult> {
    logInfo('Tentando análise com Provedor Open Source (Pollinations/Llama 3)...');
    
    try {
      const response = await axios.post('https://text.pollinations.ai/', {
        messages: [
          { role: 'system', content: 'Você é um assistente que responde apenas em JSON válido.' },
          { role: 'user', content: this.promptTemplate(text) }
        ],
        model: 'openai', // Pollinations usa 'openai' como alias para modelos de alta qualidade
        jsonMode: true
      }, { timeout: 30000 });

      let content = response.data;
      if (typeof content === 'string') {
        // Limpar possíveis markdown blocks
        content = content.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(content) as AIAnalysisResult;
      }
      return content as AIAnalysisResult;
    } catch (error) {
      logError('Falha no Provedor Open Source', error as Error);
      throw error;
    }
  }

  private async analyzeWithGemini(text: string): Promise<AIAnalysisResult> {
    logInfo('Tentando análise com Gemini 1.5 Flash...');
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    const result = await model.generateContent(this.promptTemplate(text));
    const response = await result.response;
    return JSON.parse(response.text()) as AIAnalysisResult;
  }

  private async analyzeWithDeepSeek(text: string): Promise<AIAnalysisResult> {
    logInfo('Tentando análise com DeepSeek-V3.2...');
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: this.promptTemplate(text) }],
      response_format: { type: 'json_object' },
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Resposta vazia do DeepSeek');
    return JSON.parse(content) as AIAnalysisResult;
  }

  private async analyzeWithGroq(text: string): Promise<AIAnalysisResult> {
    logInfo('Tentando análise com Groq (Llama 3.3 70B)...');
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: this.promptTemplate(text) }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });
    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('Resposta vazia do Groq');
    return JSON.parse(content) as AIAnalysisResult;
  }

  async analyzeText(text: string): Promise<AIAnalysisResult> {
    // 1. Tentar Gemini
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10) {
      try {
        return await this.analyzeWithGemini(text);
      } catch (error) {
        logError('Falha no Gemini, tentando próximo...', error as Error);
      }
    }

    // 2. Tentar DeepSeek
    if (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.length > 10) {
      try {
        return await this.analyzeWithDeepSeek(text);
      } catch (error) {
        logError('Falha no DeepSeek, tentando próximo...', error as Error);
      }
    }

    // 3. Tentar Groq
    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.length > 10) {
      try {
        return await this.analyzeWithGroq(text);
      } catch (error) {
        logError('Falha no Groq, tentando próximo...', error as Error);
      }
    }

    // 4. Fallback Final: Provedor Open Source (Sempre disponível)
    try {
      return await this.analyzeWithOpenSource(text);
    } catch (error) {
      logError('Falha em todos os provedores de IA', error as Error);
      throw new Error('Não foi possível realizar a análise de IA no momento.');
    }
  }
}

export const aiService = new AIService();
