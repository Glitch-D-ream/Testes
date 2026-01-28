import axios from 'axios';
import { logInfo, logError, logWarn } from '../core/logger.ts';

export interface NexusResponse {
  content: string;
  model: string;
  provider: string;
}

/**
 * Nexo de Resiliência de IA v2.0
 * 
 * Atualizado em 28/01/2026 para usar modelos disponíveis na API do Pollinations.
 * Inclui retry com backoff exponencial e melhor tratamento de rate limits.
 */
export class AIResilienceNexus {
  private requestQueue: Promise<any> = Promise.resolve();
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 2000; // 2 segundos entre requisições para evitar rate limit

  private providers = [
    {
      name: 'OpenAI-Env',
      models: ['gpt-4.1-nano'],
      handler: async (prompt: string, model: string) => {
        // Usar a API OpenAI configurada no ambiente (se disponível)
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('OPENAI_API_KEY não configurada');
        
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-4.1-nano',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000
        }, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
          timeout: 30000
        });
        return response.data.choices[0].message.content;
      }
    },
    {
      name: 'Pollinations-OpenAI',
      models: ['openai'],
      handler: async (prompt: string, model: string) => {
        // Modelo openai-fast/openai no Pollinations (GPT-OSS 20B)
        const response = await axios.post('https://text.pollinations.ai/', {
          messages: [{ role: 'user', content: prompt }],
          model: 'openai',
          seed: Math.floor(Math.random() * 1000000)
        }, { timeout: 25000 });
        return response.data;
      }
    },
    {
      name: 'Pollinations-Mistral',
      models: ['mistral'],
      handler: async (prompt: string, model: string) => {
        // Mistral Small 3.2 24B no Pollinations
        const response = await axios.post('https://text.pollinations.ai/', {
          messages: [{ role: 'user', content: prompt }],
          model: 'mistral',
          seed: Math.floor(Math.random() * 1000000)
        }, { timeout: 25000 });
        return response.data;
      }
    },
    {
      name: 'Pollinations-GET',
      models: ['openai-get'],
      handler: async (prompt: string, model: string) => {
        // Fallback usando método GET (às vezes funciona quando POST falha)
        const encodedPrompt = encodeURIComponent(prompt.substring(0, 500)); // Limitar tamanho para GET
        const response = await axios.get(
          `https://text.pollinations.ai/${encodedPrompt}?model=openai`,
          { timeout: 20000 }
        );
        return response.data;
      }
    }
  ];

  /**
   * Aguarda um intervalo mínimo entre requisições para evitar rate limit
   */
  private async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      logInfo(`[ResilienceNexus] Aguardando ${waitTime}ms para evitar rate limit...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Executa uma análise tentando todos os provedores e modelos em cascata
   */
  async chat(prompt: string): Promise<NexusResponse> {
    logInfo(`[ResilienceNexus] Iniciando busca por IA disponível...`);
    
    let lastError: any;
    let retryCount = 0;
    const maxRetries = 2;

    for (const provider of this.providers) {
      for (const model of provider.models) {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            await this.throttle();
            
            logInfo(`[ResilienceNexus] Tentando ${provider.name} | Modelo: ${model} | Tentativa: ${attempt + 1}`);
            const content = await provider.handler(prompt, model);
            
            // Validar resposta
            if (content && typeof content === 'string' && content.length > 10) {
              logInfo(`[ResilienceNexus] Sucesso com ${provider.name} (${model})`);
              return {
                content,
                model,
                provider: provider.name
              };
            } else if (content && typeof content === 'object') {
              const stringContent = JSON.stringify(content);
              if (stringContent.length > 10) {
                logInfo(`[ResilienceNexus] Sucesso com ${provider.name} (${model}) - resposta objeto`);
                return {
                  content: stringContent,
                  model,
                  provider: provider.name
                };
              }
            }
            
            logWarn(`[ResilienceNexus] Resposta vazia ou inválida de ${provider.name}/${model}`);
            
          } catch (error: any) {
            const status = error.response?.status;
            const errorMsg = error.response?.data?.error || error.message;
            logWarn(`[ResilienceNexus] Falha em ${provider.name}/${model}: ${status || ''} ${errorMsg}`);
            lastError = error;
            
            if (status === 429) {
              // Rate limit - aguardar mais tempo antes de tentar novamente
              const waitTime = Math.pow(2, attempt + 1) * 1000; // Backoff exponencial
              logWarn(`[ResilienceNexus] Rate limit (429). Aguardando ${waitTime}ms...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue; // Tentar novamente com o mesmo provedor
            }
            
            if (status === 401 || status === 403) {
              // Erro de autenticação - pular para o próximo provedor
              break;
            }
            
            // Para outros erros, tentar novamente com backoff
            if (attempt < maxRetries) {
              const waitTime = Math.pow(2, attempt) * 500;
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        }
      }
    }

    // Se todos os provedores falharam, retornar uma resposta de fallback
    logError(`[ResilienceNexus] Todos os provedores falharam. Retornando resposta de fallback.`);
    return {
      content: JSON.stringify({
        error: true,
        message: 'Sistema de IA temporariamente indisponível. Tente novamente em alguns minutos.',
        lastError: lastError?.message || 'Erro desconhecido'
      }),
      model: 'fallback',
      provider: 'none'
    };
  }

  /**
   * Tenta extrair JSON de uma resposta do Nexus
   */
  async chatJSON<T>(prompt: string): Promise<T> {
    const jsonPrompt = `${prompt}\n\nResponda APENAS o JSON, sem explicações ou blocos de código markdown.`;
    const response = await this.chat(jsonPrompt);
    
    try {
      let cleanContent = response.content;
      
      // Verificar se é uma resposta de erro
      if (cleanContent.includes('"error":true')) {
        throw new Error('IA indisponível');
      }
      
      // Remover markdown se presente
      cleanContent = cleanContent.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // Tentar extrair JSON de qualquer lugar na resposta
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T;
      }
      
      // Tentar parsear diretamente
      return JSON.parse(cleanContent) as T;
      
    } catch (e) {
      logError(`[ResilienceNexus] Erro ao parsear JSON da resposta:`, e as Error);
      
      // Retornar um objeto de erro tipado em vez de lançar exceção
      return {
        error: true,
        message: 'Falha ao processar resposta da IA',
        rawContent: response.content.substring(0, 500)
      } as unknown as T;
    }
  }
}

export const aiResilienceNexus = new AIResilienceNexus();
