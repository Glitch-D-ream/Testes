import axios from 'axios';
import { logInfo, logError } from '../core/logger.ts';

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
    1. PROFUNDIDADE: Não seja superficial. Analise as implicações de cada promessa baseando-se EXCLUSIVAMENTE no texto fornecido.
    2. UTILIDADE: O texto deve servir para um cidadão decidir se a promessa é realista ou não.
    3. RIGOR TÉCNICO: Use termos técnicos de administração pública quando apropriado (ex: PPA, LOA, dotação orçamentária).
    4. DETECÇÃO DE NUANCES: Identifique se a promessa depende de aprovação do Congresso ou se é ato exclusivo do Executivo.
    5. ANTI-ALUCINAÇÃO: Se o texto não contiver promessas claras, NÃO as invente. Retorne uma lista vazia de promessas.
    6. ESPECIFICIDADE: Evite riscos genéricos como "rigidez fiscal". Identifique riscos específicos à promessa (ex: "depende de alteração na Lei de Diretrizes Orçamentárias").
    
    SISTEMA DE VEREDITO EM DUAS ETAPAS:
    Para cada análise, você deve obrigatoriamente responder a duas perguntas internas:
    1. "Quais são os fatos?" (Baseado em dados e realidade atual)
    2. "Por que isso pode dar errado?" (Análise de riscos, obstáculos e ceticismo)

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
    // Ordem de Prioridade: Modelos Originais -> Backups de Elite Gratuitos
    const models = [
      'openai', 'mistral', 'llama', // Originais (Pollinations)
      'deepseek-r1', 'llama-3.3-70b', 'mistral-large' // Backups de Segurança
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
        }, { timeout: 60000 }); // Aumentado timeout para permitir respostas mais longas e profundas

        let content = response.data;
        
        if (typeof content === 'object' && content.choices) {
          content = content.choices[0]?.message?.content || content;
        }

        if (typeof content === 'string') {
          // Limpeza agressiva de markdown e textos extras
          let cleanContent = content.trim();
          
          // Se o conteúdo começar com markdown, extrair apenas o JSON
          const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleanContent = jsonMatch[0];
          }
          
          try {
            const parsed = JSON.parse(cleanContent);
            // Garantir que os novos campos existam
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
          // Garantir que os novos campos existam
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

    throw lastError || new Error('Falha ao gerar relatório de alta qualidade');
  }

  async analyzeText(text: string): Promise<AIAnalysisResult> {
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
    const models = ['openai', 'mistral', 'llama', 'deepseek-r1'];
    let lastError: any;

    for (const model of models) {
      try {
        logInfo(`[AI] Gerando relatório profissional com modelo: ${model}...`);
        const response = await axios.post('https://text.pollinations.ai/', {
          messages: [
            { 
              role: 'system', 
              content: 'Você é um auditor político sênior. Seus relatórios são famosos pela profundidade técnica, imparcialidade e formatação elegante em Markdown.' 
            },
            { role: 'user', content: prompt }
          ],
          model: model
        }, { timeout: 90000 });

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
