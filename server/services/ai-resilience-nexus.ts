
import axios from 'axios';
import { logInfo, logError, logWarn } from '../core/logger.ts';

export interface NexusResponse {
  content: string;
  model: string;
  provider: string;
}

export class AIResilienceNexus {
  private providers = [
    {
      name: 'Pollinations',
      models: ['deepseek-r1', 'qwen-qwq', 'llama-3.3-70b', 'mistral-large'],
      handler: async (prompt: string, model: string) => {
        const response = await axios.post('https://text.pollinations.ai/', {
          messages: [{ role: 'user', content: prompt }],
          model: model,
          seed: Math.floor(Math.random() * 1000000) // Evitar cache agressivo
        }, { timeout: 30000 });
        return response.data;
      }
    },
    {
      name: 'Poli-Bridge-Alt',
      models: ['openai-fast', 'search-gpt'],
      handler: async (prompt: string, model: string) => {
        const encodedPrompt = encodeURIComponent(prompt);
        const response = await axios.get(`https://text.pollinations.ai/${encodedPrompt}?model=${model}`, { timeout: 20000 });
        return response.data;
      }
    },
    {
      name: 'DuckDuckGo-Proxy',
      models: ['gpt-4o-mini', 'claude-3-haiku', 'llama-3.1-70b'],
      handler: async (prompt: string, model: string) => {
        // Simulação de acesso via proxy que não exige chave
        // Em um ambiente real, usaríamos o scraper ou um endpoint de reverse proxy
        const response = await axios.post('https://duckduckgo.com/duckchat/v1/chat', {
          query: prompt,
          model: model
        }, { 
          headers: { 'x-vqd-4': 'true' }, // Header simulado para bypass inicial
          timeout: 15000 
        });
        return response.data;
      }
    }
  ];

  /**
   * Executa uma análise tentando todos os provedores e modelos em cascata
   */
  async chat(prompt: string): Promise<NexusResponse> {
    logInfo(`[ResilienceNexus] Iniciando busca por IA disponível...`);
    
    let lastError: any;

    for (const provider of this.providers) {
      for (const model of provider.models) {
        try {
          logInfo(`[ResilienceNexus] Tentando ${provider.name} | Modelo: ${model}`);
          const content = await provider.handler(prompt, model);
          
          if (content && content.length > 10) {
            logInfo(`[ResilienceNexus] Sucesso com ${provider.name} (${model})`);
            return {
              content: typeof content === 'string' ? content : JSON.stringify(content),
              model,
              provider: provider.name
            };
          }
        } catch (error: any) {
          const status = error.response?.status;
          logWarn(`[ResilienceNexus] Falha em ${provider.name}/${model}: ${status || error.message}`);
          lastError = error;
          
          if (status === 429) {
            logWarn(`[ResilienceNexus] Rate limit atingido. Pulando para próximo provedor.`);
            break; // Pula para o próximo provedor se o atual deu 429
          }
          continue;
        }
      }
    }

    throw new Error(`[ResilienceNexus] Todos os provedores gratuitos falharam. Último erro: ${lastError?.message}`);
  }

  /**
   * Tenta extrair JSON de uma resposta do Nexus
   */
  async chatJSON<T>(prompt: string): Promise<T> {
    const jsonPrompt = `${prompt}\n\nResponda APENAS o JSON, sem explicações ou blocos de código markdown.`;
    const response = await this.chat(jsonPrompt);
    
    try {
      let cleanContent = response.content;
      // Remover markdown se presente
      cleanContent = cleanContent.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : cleanContent) as T;
    } catch (e) {
      logError(`[ResilienceNexus] Erro ao parsear JSON da resposta:`, e as Error);
      throw new Error('Resposta da IA não contém um JSON válido');
    }
  }
}

export const aiResilienceNexus = new AIResilienceNexus();
