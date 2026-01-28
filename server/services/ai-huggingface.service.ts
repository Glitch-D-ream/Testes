
import axios from 'axios';
import { logInfo, logError, logWarn } from '../core/logger.ts';

export class HuggingFaceService {
  private token: string;
  private baseUrl = 'https://api-inference.huggingface.co/models/';

  constructor() {
    this.token = process.env.HUGGINGFACE_TOKEN || '';
  }

  /**
   * Sumarização de textos longos (Notícias/Entrevistas)
   */
  async summarize(text: string): Promise<string> {
    if (!this.token) {
      logWarn('[HuggingFace] Token não configurado, pulando sumarização.');
      return typeof text === 'string' ? text.substring(0, 1000) : "";
    }

    try {
      logInfo('[HuggingFace] Iniciando sumarização...');
      const response = await axios.post(
        `${this.baseUrl}facebook/bart-large-cnn`,
        { inputs: text },
        { headers: { Authorization: `Bearer ${this.token}` }, timeout: 30000 }
      );

      if (Array.isArray(response.data) && response.data[0].summary_text) {
        return response.data[0].summary_text;
      }
      return text.substring(0, 1000);
    } catch (error: any) {
      logError(`[HuggingFace] Erro na sumarização: ${error.message}`);
      return text.substring(0, 1000);
    }
  }

  /**
   * Extração de Entidades (NER) para o Scout Case Miner
   */
  async extractEntities(text: string): Promise<any[]> {
    if (!this.token) return [];

    try {
      logInfo('[HuggingFace] Extraindo entidades...');
      const response = await axios.post(
        `${this.baseUrl}dbmdz/bert-large-cased-finetuned-conll03-english`,
        { inputs: text },
        { headers: { Authorization: `Bearer ${this.token}` }, timeout: 20000 }
      );

      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      logError(`[HuggingFace] Erro no NER: ${error.message}`);
      return [];
    }
  }

  /**
   * Extrai citações diretas (entre aspas) de um texto
   * Útil para capturar falas literais de políticos
   */
  extractQuotes(text: string): string[] {
    const quoteRegex = /"([^"]{20,})"/g;
    const quotes = new Set<string>();
    let match;
    while ((match = quoteRegex.exec(text)) !== null) {
      quotes.add(match[1].trim());
    }
    return Array.from(quotes);
  }
}

export const huggingFaceService = new HuggingFaceService();
