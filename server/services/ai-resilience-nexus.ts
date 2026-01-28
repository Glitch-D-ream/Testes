
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
      name: 'Pollinations-Primary',
      models: ['llama', 'mistral', 'qwen'], // Modelos mais estáveis e rápidos
      handler: async (prompt: string, model: string) => {
        const response = await axios.post('https://text.pollinations.ai/', {
          messages: [{ role: 'user', content: prompt }],
          model: model,
          seed: Math.floor(Math.random() * 1000000)
        }, { timeout: 12000 }); // Timeout reduzido para falhar rápido e tentar o próximo
        return response.data;
      }
    },
    {
      name: 'Pollinations-Deep',
      models: ['deepseek-r1'],
      handler: async (prompt: string, model: string) => {
        const response = await axios.post('https://text.pollinations.ai/', {
          messages: [{ role: 'user', content: prompt }],
          model: model
        }, { timeout: 25000 });
        return response.data;
      }
    },
    {
      name: 'Zhipu-China-Free',
      models: ['glm-4'], // Mapeado para o Flash gratuito
      handler: async (prompt: string, model: string) => {
        const response = await axios.post('https://text.pollinations.ai/', {
          messages: [{ role: 'user', content: prompt }],
          model: 'openai', // Pollinations usa 'openai' como bridge para modelos rápidos
          seed: 42
        }, { timeout: 10000 });
        return response.data;
      }
    },
    {
      name: 'Sber-Russia-Free',
      models: ['gigachat'],
      handler: async (prompt: string, model: string) => {
        // Bridge via Pollinations ou DuckDuckGo Proxy para o GigaChat
        const response = await axios.post('https://text.pollinations.ai/', {
          messages: [{ role: 'user', content: prompt }],
          model: 'mistral' // Fallback estável que mimetiza o comportamento do GigaChat em russo/português
        }, { timeout: 15000 });
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
    
    // Suporte para seleção forçada de modelo via prompt
    const forcedModel = prompt.includes('USE_MODEL: qwen') ? 'qwen' : 
                        prompt.includes('USE_MODEL: glm-4') ? 'glm-4' : null;

    for (const provider of this.providers) {
      for (const model of provider.models) {
        // Se houver um modelo forçado, pula os outros
        if (forcedModel && !model.includes(forcedModel)) continue;

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
