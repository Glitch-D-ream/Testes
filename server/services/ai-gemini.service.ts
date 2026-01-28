
import axios from 'axios';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { AIAnalysisResult } from './ai.service.ts';
import { normalizationService } from './normalization.service.ts';

export class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
  }

  /**
   * Analisa texto usando Gemini 1.5 Flash (Free Tier)
   */
  async analyzeText(text: string, promptTemplate: (text: string) => string): Promise<AIAnalysisResult> {
    logInfo('[Gemini] Iniciando análise forense...');

    try {
      let content = "";
      
      if (this.apiKey && !this.apiKey.includes('your-')) {
        // Fluxo com chave oficial
        const response = await axios.post(
          `${this.baseUrl}?key=${this.apiKey}`,
          {
            contents: [{ parts: [{ text: promptTemplate(text) }] }],
            generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
          },
          { timeout: 60000 }
        );
        content = response.data.candidates[0].content.parts[0].text;
      } else {
        // Fluxo Zero-Key via Pollinations (que agora suporta gemini-flash como modelo)
        logInfo('[Gemini] Usando Bridge Zero-Key (Pollinations Gemini Flash)...');
        const response = await axios.post('https://text.pollinations.ai/', {
          messages: [{ role: 'user', content: promptTemplate(text) }],
          model: 'gemini-flash',
          jsonMode: true
        }, { timeout: 60000 });
        content = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      }
      
      return normalizationService.normalizeAIOutput(content);
    } catch (error: any) {
      logError(`[Gemini] Falha na análise: ${error.message}`);
      if (error.response) {
        logError(`[Gemini] Status: ${error.response.status} - Data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Geração de texto genérico (relatórios)
   */
  async generateCompletion(prompt: string): Promise<string> {
    if (!this.apiKey) throw new Error('GEMINI_API_KEY não configurada');

    try {
      const response = await axios.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        }
      );
      return response.data.candidates[0].content.parts[0].text;
    } catch (error: any) {
      logError(`[Gemini] Falha na geração: ${error.message}`);
      return `FALHA NA GERAÇÃO GEMINI: ${error.message}`;
    }
  }
}

export const geminiService = new GeminiService();
