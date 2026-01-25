
import axios from 'axios';
import { logInfo, logError } from '../core/logger.ts';

export class GroqService {
  private get apiKey() { return process.env.GROQ_API_KEY; }
  private readonly apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly model = 'llama-3.3-70b-versatile'; // Modelo estável e versátil

  async generateCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY não configurada');
    }

    try {
      logInfo(`[Groq] Iniciando geração com modelo: ${this.model}`);
      const startTime = Date.now();

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1, // Baixa temperatura para maior precisão técnica
          max_tokens: 4096
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const duration = Date.now() - startTime;
      logInfo(`[Groq] Resposta recebida em ${duration}ms`);

      return response.data.choices[0]?.message?.content || '';
    } catch (error: any) {
      logError('[Groq] Erro na chamada da API', error);
      throw error;
    }
  }
}

export const groqService = new GroqService();
