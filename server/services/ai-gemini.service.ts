
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
   * Analisa texto usando Gemini 1.5 Flash ou Fallbacks Gratuitos Robustos
   */
  async analyzeText(text: string, promptTemplate: (text: string) => string): Promise<AIAnalysisResult> {
    logInfo('[Gemini] Iniciando análise forense v3.2...');

    // Tentar primeiro com a chave oficial se existir
    if (this.apiKey && !this.apiKey.includes('your-')) {
      try {
        logInfo('[Gemini] Tentando API Oficial...');
        const response = await axios.post(
          `${this.baseUrl}?key=${this.apiKey}`,
          {
            contents: [{ parts: [{ text: promptTemplate(text) }] }],
            generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
          },
          { timeout: 45000 }
        );
        const content = response.data.candidates[0].content.parts[0].text;
        return normalizationService.normalizeAIOutput(content);
      } catch (error: any) {
        logWarn(`[Gemini] API Oficial falhou: ${error.message}. Tentando Bridge...`);
      }
    }

    // Fallback: Pollinations Llama (O mais estável para evitar sobrecarga)
    try {
      logInfo('[Gemini] Usando Fallback Estável (Llama)...');
      const response = await axios.post('https://text.pollinations.ai/', {
        messages: [{ role: 'user', content: promptTemplate(text) }],
        model: 'llama',
        jsonMode: true
      }, { timeout: 15000 }); // Timeout curto para não travar o frontend
      
      const content = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      return normalizationService.normalizeAIOutput(content);
    } catch (error: any) {
      logError(`[Gemini] Todos os motores falharam: ${error.message}`);
      throw error;
    }
  }

  /**
   * Geração de texto genérico (relatórios)
   */
  async generateCompletion(prompt: string): Promise<string> {
    try {
      // Tentar Pollinations diretamente para rapidez em relatórios
      const response = await axios.post('https://text.pollinations.ai/', {
        messages: [{ role: 'user', content: prompt }],
        model: 'openai' // Mapeia para gpt-4o-mini ou similar gratuito
      }, { timeout: 30000 });
      
      return typeof response.data === 'string' ? response.data : response.data.choices?.[0]?.message?.content || JSON.stringify(response.data);
    } catch (error: any) {
      logError(`[Gemini] Falha na geração de relatório: ${error.message}`);
      return `ERRO NA GERAÇÃO: O sistema de IA está temporariamente sobrecarregado. Tente novamente em instantes.`;
    }
  }
}

export const geminiService = new GeminiService();
