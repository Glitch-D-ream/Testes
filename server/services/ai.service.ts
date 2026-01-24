import axios from 'axios';
import { logInfo, logError } from '../core/logger.js';

export interface AIAnalysisResult {
  promises: Array<{
    text: string;
    category: string;
    confidence: number;
    negated: boolean;
    conditional: boolean;
    reasoning: string;
  }>;
  overallSentiment: string;
  credibilityScore: number;
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
    1. PROFUNDIDADE: Não seja superficial. Analise as implicações de cada promessa.
    2. UTILIDADE: O texto deve servir para um cidadão decidir se a promessa é realista ou não.
    3. RIGOR TÉCNICO: Use termos técnicos de administração pública quando apropriado (ex: PPA, LOA, dotação orçamentária).
    4. DETECÇÃO DE NUANCES: Identifique se a promessa depende de aprovação do Congresso ou se é ato exclusivo do Executivo.
    
    Para cada promessa extraída, forneça um raciocínio (reasoning) que explique:
    - Por que ela é difícil ou fácil de cumprir.
    - Qual o impacto social esperado.
    - Se existe base legal óbvia para ela.
    
    Responda estritamente em formato JSON seguindo esta estrutura:
    {
      "promises": [
        {
          "text": "Texto integral da promessa",
          "category": "Saúde/Educação/Economia/etc",
          "confidence": 0.95,
          "negated": false,
          "conditional": true,
          "reasoning": "Análise técnica profunda sobre a viabilidade e impacto desta promessa específica."
        }
      ],
      "overallSentiment": "Análise qualitativa do tom do discurso (ex: Populista, Técnico, Austero)",
      "credibilityScore": 85
    }
    
    Texto para análise:
    ${text}`;
  }

  /**
   * Provedor de Código Aberto (Pollinations AI) com Multi-Model Fallback
   * Usando modelos de alto nível para garantir a qualidade do texto.
   */
  private async analyzeWithOpenSource(text: string): Promise<AIAnalysisResult> {
    // Focando nos modelos que demonstraram melhor capacidade de escrita profunda
    const models = ['openai', 'mistral', 'llama'];
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
          content = content.replace(/```json\n?|\n?```/g, '').trim();
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) content = jsonMatch[0];
          return JSON.parse(content) as AIAnalysisResult;
        }
        
        if (content && content.promises) return content as AIAnalysisResult;
        
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
}

export const aiService = new AIService();
