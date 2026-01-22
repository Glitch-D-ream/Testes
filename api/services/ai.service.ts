import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import OpenAI from 'openai';
import { logInfo, logError } from '../core/logger.js';

// Configuração dos Provedores Gratuitos
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

// DeepSeek é compatível com a API da OpenAI
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
   * Tenta análise com Gemini (Provedor Primário - Melhor Português)
   */
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

  /**
   * Tenta análise com DeepSeek (Provedor de Alta Qualidade e Baixo Custo)
   */
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

  /**
   * Tenta análise com Groq/Llama 3 (Provedor de Fallback Ultra-rápido)
   */
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

  /**
   * Método principal com lógica de Fallback entre provedores gratuitos
   */
  async analyzeText(text: string): Promise<AIAnalysisResult> {
    // 1. Tentar Gemini primeiro (melhor para português e contexto longo)
    if (process.env.GEMINI_API_KEY) {
      try {
        return await this.analyzeWithGemini(text);
      } catch (error) {
        logError('Falha no Gemini, tentando DeepSeek...', error as Error);
      }
    }

    // 2. Tentar DeepSeek (excelente raciocínio e créditos gratuitos iniciais)
    if (process.env.DEEPSEEK_API_KEY) {
      try {
        return await this.analyzeWithDeepSeek(text);
      } catch (error) {
        logError('Falha no DeepSeek, tentando Groq...', error as Error);
      }
    }

    // 3. Tentar Groq como fallback final (ultra-rápido)
    if (process.env.GROQ_API_KEY) {
      try {
        return await this.analyzeWithGroq(text);
      } catch (error) {
        logError('Falha no Groq...', error as Error);
      }
    }

    throw new Error('Nenhum provedor de IA gratuito disponível ou configurado corretamente.');
  }
}

export const aiService = new AIService();
