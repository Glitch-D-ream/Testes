import axios from 'axios';
import { logInfo, logError, logWarn } from '../core/logger.ts';

export interface NexusResponse {
  content: string;
  model: string;
  provider: string;
}

/**
 * Nexo de Resiliência de IA v3.0
 * 
 * Atualizado em 28/01/2026 para usar provedores sem filtros de conteúdo político.
 * Prioriza modelos open-source "uncensored" que não bloqueiam análises políticas.
 * 
 * Ordem de fallback:
 * 1. Groq (Llama 3.3 70B) - Rápido, modelos open-source
 * 2. OpenRouter (Dolphin Mistral) - Explicitamente uncensored
 * 3. DeepSeek - Modelo chinês, menos filtros ocidentais
 * 4. Cerebras - Backup com limites generosos
 * 5. Pollinations - Último recurso
 */
export class AIResilienceNexus {
  private requestQueue: Promise<any> = Promise.resolve();
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 1500; // 1.5 segundos entre requisições

  private providers = [
    // 1. GROQ - Rápido e com modelos open-source (menos filtros)
    {
      name: 'Groq-Llama',
      models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
      handler: async (prompt: string, model: string) => {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) throw new Error('GROQ_API_KEY não configurada');
        
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4000,
          temperature: 0.7
        }, {
          headers: { 
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        return response.data.choices[0].message.content;
      }
    },
    
    // 2. OpenRouter - Modelo Dolphin UNCENSORED (gratuito)
    {
      name: 'OpenRouter-Dolphin',
      models: ['cognitivecomputations/dolphin-mistral-24b-venice-edition:free'],
      handler: async (prompt: string, model: string) => {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) throw new Error('OPENROUTER_API_KEY não configurada');
        
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4000
        }, {
          headers: { 
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://seth-vii.up.railway.app',
            'X-Title': 'Seth VII Political Analysis'
          },
          timeout: 45000
        });
        return response.data.choices[0].message.content;
      }
    },
    
    // 3. OpenRouter - Modelos gratuitos alternativos
    {
      name: 'OpenRouter-Free',
      models: ['qwen/qwen3-4b:free', 'deepseek/deepseek-r1-0528:free'],
      handler: async (prompt: string, model: string) => {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) throw new Error('OPENROUTER_API_KEY não configurada');
        
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4000
        }, {
          headers: { 
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 45000
        });
        return response.data.choices[0].message.content;
      }
    },
    
    // 4. DeepSeek - Modelo chinês, menos filtros ocidentais
    {
      name: 'DeepSeek',
      models: ['deepseek-chat'],
      handler: async (prompt: string, model: string) => {
        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) throw new Error('DEEPSEEK_API_KEY não configurada');
        
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4000,
          temperature: 0.7
        }, {
          headers: { 
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        return response.data.choices[0].message.content;
      }
    },
    
    // 5. Cerebras - Modelos open-source com limites generosos
    {
      name: 'Cerebras',
      models: ['llama-3.3-70b'],
      handler: async (prompt: string, model: string) => {
        const apiKey = process.env.CEREBRAS_API_KEY;
        if (!apiKey) throw new Error('CEREBRAS_API_KEY não configurada');
        
        const response = await axios.post('https://api.cerebras.ai/v1/chat/completions', {
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4000
        }, {
          headers: { 
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        return response.data.choices[0].message.content;
      }
    },
    
    // 6. Gemini - Via Google AI Studio (gratuito)
    {
      name: 'Gemini',
      models: ['gemini-2.0-flash'],
      handler: async (prompt: string, model: string) => {
        const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GOOGLE_AI_API_KEY não configurada');
        
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 4000,
              temperature: 0.7
            }
          },
          { timeout: 30000 }
        );
        return response.data.candidates[0].content.parts[0].text;
      }
    },
    
    // 7. Pollinations - Último recurso (pode ter filtros)
    {
      name: 'Pollinations-Mistral',
      models: ['mistral'],
      handler: async (prompt: string, model: string) => {
        // Reformular prompt para ser mais neutro e evitar filtros
        const safePrompt = this.reformulatePrompt(prompt);
        
        const response = await axios.post('https://text.pollinations.ai/', {
          messages: [{ role: 'user', content: safePrompt }],
          model: 'mistral',
          seed: Math.floor(Math.random() * 1000000)
        }, { timeout: 25000 });
        return response.data;
      }
    }
  ];

  /**
   * Reformula prompts para evitar filtros de conteúdo
   * Transforma linguagem "adversarial" em linguagem "informativa"
   */
  private reformulatePrompt(prompt: string): string {
    // Substituições para tornar o prompt mais neutro
    let safePrompt = prompt
      .replace(/mentiu|mentira|mentiroso/gi, 'fez declaração imprecisa')
      .replace(/corrupto|corrupção/gi, 'envolvido em investigações')
      .replace(/criminoso|crime/gi, 'objeto de investigação')
      .replace(/analise as promessas de/gi, 'forneça informações sobre declarações públicas de')
      .replace(/verifique se/gi, 'compare dados sobre')
      .replace(/investigue/gi, 'pesquise informações sobre');
    
    return safePrompt;
  }

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
   * Verifica se a resposta foi bloqueada por filtros de conteúdo
   */
  private isContentFiltered(content: string): boolean {
    const filterPatterns = [
      /i('m| am) sorry,? but i can('t| not)/i,
      /i cannot (help|assist|provide)/i,
      /as an ai,? i (cannot|can't|am not able)/i,
      /i('m| am) not able to (help|assist|provide)/i,
      /this request (violates|goes against)/i,
      /i('m| am) unable to (generate|create|provide)/i,
      /content policy/i,
      /harmful content/i
    ];
    
    return filterPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Executa uma análise tentando todos os provedores e modelos em cascata
   */
  async chat(prompt: string): Promise<NexusResponse> {
    logInfo(`[ResilienceNexus] Iniciando busca por IA disponível...`);
    
    let lastError: any;
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
              // Verificar se foi bloqueado por filtros
              if (this.isContentFiltered(content)) {
                logWarn(`[ResilienceNexus] Resposta bloqueada por filtros em ${provider.name}/${model}`);
                break; // Tentar próximo provedor
              }
              
              logInfo(`[ResilienceNexus] Sucesso com ${provider.name} (${model})`);
              return {
                content,
                model,
                provider: provider.name
              };
            } else if (content && typeof content === 'object') {
              const stringContent = JSON.stringify(content);
              if (stringContent.length > 10 && !this.isContentFiltered(stringContent)) {
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
              const waitTime = Math.pow(2, attempt + 1) * 1000;
              logWarn(`[ResilienceNexus] Rate limit (429). Aguardando ${waitTime}ms...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
            
            if (status === 401 || status === 403) {
              // Erro de autenticação - pular para o próximo provedor
              logWarn(`[ResilienceNexus] Erro de autenticação em ${provider.name}. Pulando...`);
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
        lastError: lastError?.message || 'Erro desconhecido',
        suggestion: 'Verifique se as chaves de API estão configuradas: GROQ_API_KEY, OPENROUTER_API_KEY, DEEPSEEK_API_KEY'
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
      
      return {
        error: true,
        message: 'Falha ao processar resposta da IA',
        rawContent: response.content.substring(0, 500)
      } as unknown as T;
    }
  }
}

export const aiResilienceNexus = new AIResilienceNexus();
