import axios from 'axios';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { groqService } from './ai-groq.service.ts';
import { deepSeekService } from './ai-deepseek.service.ts';

export interface AIAnalysisResult {
  promises: Array<{
    text: string;
    category: string;
    confidence: number;
    negated: boolean;
    conditional: boolean;
    reasoning: string;
    risks: string[]; // Seção de Riscos de Descumprimento
  }>;
  overallSentiment: string;
  credibilityScore: number;
  verdict: {
    facts: string[];
    skepticism: string[]; // "Por que isso pode dar errado?"
  };
}

export class AIService {
  /**
   * Prompt de Alta Performance (Versão Restaurada e Melhorada)
   * Focado em profundidade, utilidade e análise técnica rigorosa.
   */
  private promptTemplate(text: string): string {
    return `Você é um analista político de elite, especializado em auditoria de promessas e análise de viabilidade.
    Sua missão é transformar o texto bruto em um relatório de inteligência profundo, útil e extremamente detalhado.
    
    DIRETRIZES DE QUALIDADE:
    1. PROFUNDIDADE: Analise as implicações técnicas de cada promessa.
    2. UTILIDADE: Ajude o cidadão a entender se a promessa é realista.
    3. RIGOR TÉCNICO: Use termos como dotação orçamentária e viabilidade fiscal.
    4. RESILIÊNCIA: Se não houver promessas explícitas, identifique a principal intenção política ou projeto mencionado.
    5. ESPECIFICIDADE: Identifique riscos concretos de descumprimento.
    6. FOCO EM CONTRASTE: Se houver dados de histórico legislativo, use-os para validar ou refutar a promessa.
    
    SISTEMA DE VEREDITO:
    Para cada análise, identifique os fatos principais e os obstáculos (por que isso pode dar errado).

    Para cada promessa extraída, forneça:
    - Um raciocínio (reasoning) técnico.
    - Uma lista de "riscos" (risks) específicos de descumprimento.
    
    Responda estritamente em formato JSON seguindo esta estrutura:
    {
      "promises": [
        {
          "text": "Texto integral da promessa",
          "category": "Saúde/Educação/Economia/etc",
          "estimatedValue": 1000000,
          "confidence": 0.95,
          "negated": false,
          "conditional": true,
          "reasoning": "Análise técnica profunda sobre a viabilidade e impacto desta promessa específica.",
          "risks": ["Risco 1", "Risco 2"]
        }
      ],
      "overallSentiment": "Análise qualitativa do tom do discurso (ex: Populista, Técnico, Austero)",
      "credibilityScore": 85,
      "verdict": {
        "facts": ["Fato 1", "Fato 2"],
        "skepticism": ["Obstáculo 1", "Motivo de falha 2"]
      }
    }
    
    Texto para análise:
    ${text}`;
  }

  /**
   * Provedor de Código Aberto (Pollinations AI) com Multi-Model Fallback
   * Usando modelos de alto nível para garantir a qualidade do texto.
   */
  private async analyzeWithOpenSource(text: string): Promise<AIAnalysisResult> {
    // Ordem de Prioridade: Apenas modelos de Código Aberto via Pollinations
    const models = [
      'mistral', 'llama', 'deepseek-r1', 'llama-3.3-70b', 'mistral-large', 'qwen-qwq'
    ];
    let lastError: any;

    for (const model of models) {
      try {
        logInfo(`[AI] Gerando relatório de alta qualidade com modelo: ${model}...`);
        const response = await axios.post('https://text.pollinations.ai/', {
          messages: [
            { 
              role: 'system', 
              content: 'Você é um analista político sênior. Seus relatórios são famosos pela profundidade técnica e utilidade prática. Você nunca é superficial. Responda apenas JSON.' 
            },
            { role: 'user', content: this.promptTemplate(text) }
          ],
          model: model,
          jsonMode: true
        }, { timeout: 15000 });

        let content = response.data;
        
        if (typeof content === 'object' && content.choices) {
          content = content.choices[0]?.message?.content || content;
        }

        if (typeof content === 'string') {
          let cleanContent = content.trim();
          const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleanContent = jsonMatch[0];
          }
          
          try {
            const parsed = JSON.parse(cleanContent);
            if (!parsed.verdict) {
              parsed.verdict = { facts: [], skepticism: [] };
            }
            if (parsed.promises) {
              parsed.promises = parsed.promises.map((p: any) => ({
                ...p,
                risks: p.risks || []
              }));
            }
            return parsed as AIAnalysisResult;
          } catch (parseError) {
            logError(`[AI] Erro ao parsear JSON do modelo ${model}`, parseError as Error);
            throw parseError;
          }
        }
        
        if (content && content.promises) {
          const result = content as AIAnalysisResult;
          if (!result.verdict) {
            result.verdict = { facts: [], skepticism: [] };
          }
          result.promises = result.promises.map(p => ({
            ...p,
            risks: p.risks || []
          }));
          return result;
        }
        
        throw new Error(`Modelo ${model} não gerou a profundidade esperada`);
      } catch (error) {
        logError(`[AI] Falha na tentativa com ${model}`, error as Error);
        lastError = error;
        continue;
      }
    }

    logError('[AI] Todos os modelos de alta qualidade falharam.');
    throw new Error('Não foi possível gerar uma análise técnica precisa devido à instabilidade nos provedores de IA.');
  }

  async analyzeText(text: string): Promise<AIAnalysisResult> {
    // 1. Tentar DeepSeek R1 via OpenRouter (Elite - Raciocínio Profundo)
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (openRouterKey) {
      try {
        logInfo('[AI] Tentando DeepSeek R1 para análise de raciocínio profundo...');
        return await deepSeekService.analyzeText(text, openRouterKey);
      } catch (error: any) {
        logWarn(`[AI] DeepSeek R1 falhou: ${error.message}. Tentando Groq...`);
      }
    }

    // 2. Tentar Groq (Rápido e Eficiente)
    try {
      logInfo('[AI] Tentando Groq para análise estruturada...');
      const systemPrompt = 'Você é um analista político sênior. Responda estritamente em JSON.';
      const prompt = this.promptTemplate(text);
      const result = await groqService.generateCompletion(systemPrompt, prompt);
      
      if (result) {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (!parsed.verdict) parsed.verdict = { facts: [], skepticism: [] };
          if (parsed.promises) {
            parsed.promises = parsed.promises.map((p: any) => ({
              ...p,
              risks: p.risks || []
            }));
          }
          return parsed as AIAnalysisResult;
        }
      }
    } catch (error: any) {
      logWarn(`[AI] Groq falhou na análise estruturada: ${error.message}. Tentando Pollinations...`);
    }

    // 3. Fallback para Pollinations (Código Aberto / Gratuito)
    try {
      return await this.analyzeWithOpenSource(text);
    } catch (error) {
      logError('Erro crítico na geração do relatório', error as Error);
      throw new Error('Não foi possível gerar o relatório detalhado no momento.');
    }
  }

  /**
   * Geração de texto livre (Markdown) para relatórios profissionais
   */
  async generateReport(prompt: string): Promise<string> {
    // 1. Tentar Groq (Primário - Ultra Rápido)
    try {
      logInfo('[AI] Tentando Groq como provedor primário...');
      const systemPrompt = `Você é o núcleo de inteligência do sistema Seth VII. 
      Sua função é AUDITORIA TÉCNICA PURA. 
      REGRAS INVIOLÁVEIS:
      1. PROIBIDO EMOÇÃO: Não use exclamações, adjetivos elogiosos ou pejorativos.
      2. PROIBIDO ALUCINAÇÃO: Se um dado não foi fornecido no prompt, você NÃO pode inventá-lo. Responda "Dados não disponíveis".
      3. IMPARCIALIDADE: Trate todos os políticos com o mesmo rigor frio, seja de direita, esquerda ou centro.
      4. FOCO ORÇAMENTÁRIO: Priorize sempre a viabilidade fiscal (SICONFI) sobre a retórica política.`;
      
      const result = await groqService.generateCompletion(systemPrompt, prompt);
      if (result) return result;
    } catch (error: any) {
      logWarn(`[AI] Groq falhou: ${error.message}. Tentando fallbacks tradicionais...`);
    }

    // 2. Fallbacks tradicionais (Pollinations)
    const models = ['mistral', 'llama', 'deepseek-r1', 'qwen-qwq'];
    let lastError: any;

    for (const model of models) {
      try {
        logInfo(`[AI] Gerando relatório profissional com modelo: ${model}...`);
        const response = await axios.post('https://text.pollinations.ai/', {
          messages: [
            { 
              role: 'system', 
              content: `Você é o núcleo de inteligência do sistema Seth VII. 
              Sua função é AUDITORIA TÉCNICA PURA. 
              REGRAS INVIOLÁVEIS:
              1. PROIBIDO EMOÇÃO: Não use exclamações, adjetivos elogiosos ou pejorativos.
              2. PROIBIDO ALUCINAÇÃO: Se um dado não foi fornecido no prompt, você NÃO pode inventá-lo. Responda "Dados não disponíveis".
              3. IMPARCIALIDADE: Trate todos os políticos com o mesmo rigor frio, seja de direita, esquerda ou centro.
              4. FOCO ORÇAMENTÁRIO: Priorize sempre a viabilidade fiscal (SICONFI) sobre a retórica política.` 
            },
            { role: 'user', content: prompt }
          ],
          model: model
        }, { timeout: 15000 });

        if (response.data && typeof response.data === 'string') {
          return response.data;
        }
        
        if (response.data && response.data.choices) {
          return response.data.choices[0]?.message?.content || "";
        }

        throw new Error(`Modelo ${model} não gerou texto válido`);
      } catch (error) {
        logError(`[AI] Falha na geração de relatório com ${model}`, error as Error);
        lastError = error;
        continue;
      }
    }

    throw lastError || new Error('Falha ao gerar relatório profissional');
  }
}

export const aiService = new AIService();
