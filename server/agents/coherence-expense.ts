/**
 * Coherence Expense Agent v1.0
 * 
 * Cruza promessas extraídas com gastos da cota parlamentar e emendas
 * Identifica se os gastos estão alinhados com as promessas feitas
 */

import { logInfo, logError, logWarn } from '../core/logger.ts';
import { aiResilienceNexus } from '../services/ai-resilience-nexus.ts';
import { getDeputadoId } from '../integrations/camara.ts';
import { financeService, FinanceEvidence } from '../services/finance.service.ts';

export interface PromiseInput {
  text: string;
  category: string;
  source: string;
  date?: string;
  quote?: string;
}

export interface ExpenseCoherenceResult {
  promise: PromiseInput;
  relatedExpenses: ExpenseAnalysis[];
  totalRelatedValue: number;
  coherenceScore: number;  // 0-100
  verdict: 'COERENTE' | 'PARCIALMENTE_COERENTE' | 'INCOERENTE' | 'SEM_DADOS';
  summary: string;
  redFlags: string[];
}

export interface ExpenseAnalysis {
  expense: FinanceEvidence;
  relation: 'ALINHADO' | 'CONTRADITORIO' | 'NEUTRO';
  explanation: string;
}

export interface ExpenseProfile {
  totalExpenses: number;
  byCategory: Record<string, { total: number; percentage: number; count: number }>;
  topCategories: { category: string; total: number; percentage: number }[];
  redFlags: string[];
}

export class CoherenceExpenseAgent {
  /**
   * Analisa a coerência entre promessas e gastos
   */
  async analyze(
    politicianName: string,
    promises: PromiseInput[]
  ): Promise<{ results: ExpenseCoherenceResult[]; profile: ExpenseProfile }> {
    logInfo(`[CoherenceExpense] Analisando coerência de gastos para: ${politicianName}`);

    const results: ExpenseCoherenceResult[] = [];

    try {
      // 1. Buscar ID do deputado
      const deputadoId = await getDeputadoId(politicianName);
      if (!deputadoId) {
        logWarn(`[CoherenceExpense] Deputado não encontrado: ${politicianName}`);
        return {
          results: promises.map(p => this.createEmptyResult(p, 'Político não encontrado na base da Câmara.')),
          profile: this.createEmptyProfile()
        };
      }

      // 2. Buscar gastos do deputado (2024 e 2023)
      const expenses2024 = await financeService.getParlamentaryExpenses(deputadoId, 2024);
      const expenses2023 = await financeService.getParlamentaryExpenses(deputadoId, 2023);
      const allExpenses = [...expenses2024, ...expenses2023];

      logInfo(`[CoherenceExpense] ${allExpenses.length} despesas encontradas`);

      if (allExpenses.length === 0) {
        return {
          results: promises.map(p => this.createEmptyResult(p, 'Nenhuma despesa encontrada.')),
          profile: this.createEmptyProfile()
        };
      }

      // 3. Criar perfil de gastos
      const profile = this.createExpenseProfile(allExpenses);

      // 4. Para cada promessa, analisar gastos relacionados
      for (const promise of promises) {
        const result = await this.analyzePromiseVsExpenses(promise, allExpenses, profile, politicianName);
        results.push(result);
      }

      return { results, profile };

    } catch (error: any) {
      logError(`[CoherenceExpense] Erro na análise: ${error.message}`);
      return {
        results: promises.map(p => this.createEmptyResult(p, 'Erro ao processar análise.')),
        profile: this.createEmptyProfile()
      };
    }
  }

  /**
   * Cria perfil consolidado de gastos
   */
  private createExpenseProfile(expenses: FinanceEvidence[]): ExpenseProfile {
    const byCategory: Record<string, { total: number; count: number }> = {};
    let totalExpenses = 0;

    for (const expense of expenses) {
      const category = expense.description || 'Outros';
      const value = expense.value || 0;
      
      if (!byCategory[category]) {
        byCategory[category] = { total: 0, count: 0 };
      }
      byCategory[category].total += value;
      byCategory[category].count += 1;
      totalExpenses += value;
    }

    // Calcular percentuais
    const byCategoryWithPercentage: Record<string, { total: number; percentage: number; count: number }> = {};
    for (const [cat, data] of Object.entries(byCategory)) {
      byCategoryWithPercentage[cat] = {
        ...data,
        percentage: totalExpenses > 0 ? Math.round((data.total / totalExpenses) * 100) : 0
      };
    }

    // Top categorias
    const topCategories = Object.entries(byCategoryWithPercentage)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Detectar red flags
    const redFlags: string[] = [];
    
    // Red flag: Mais de 50% em uma única categoria
    const topCategory = topCategories[0];
    if (topCategory && topCategory.percentage > 50) {
      redFlags.push(`${topCategory.percentage}% dos gastos concentrados em "${topCategory.category}"`);
    }

    // Red flag: Gastos com combustíveis muito altos
    const combustiveis = byCategoryWithPercentage['COMBUSTÍVEIS E LUBRIFICANTES.'];
    if (combustiveis && combustiveis.percentage > 30) {
      redFlags.push(`Gastos elevados com combustíveis: ${combustiveis.percentage}% do total`);
    }

    // Red flag: Valores repetidos (possível irregularidade)
    const values = expenses.map(e => e.value).filter(v => v && v > 100);
    const valueCounts: Record<number, number> = {};
    for (const v of values) {
      if (v) {
        valueCounts[v] = (valueCounts[v] || 0) + 1;
      }
    }
    for (const [value, count] of Object.entries(valueCounts)) {
      if (count >= 5) {
        redFlags.push(`Valor R$ ${Number(value).toFixed(2)} aparece ${count} vezes (possível padrão suspeito)`);
      }
    }

    return {
      totalExpenses,
      byCategory: byCategoryWithPercentage,
      topCategories,
      redFlags
    };
  }

  /**
   * Analisa uma promessa específica contra os gastos
   */
  private async analyzePromiseVsExpenses(
    promise: PromiseInput,
    expenses: FinanceEvidence[],
    profile: ExpenseProfile,
    politicianName: string
  ): Promise<ExpenseCoherenceResult> {
    logInfo(`[CoherenceExpense] Analisando promessa: ${promise.text.substring(0, 50)}...`);

    try {
      const prompt = `
VOCÊ É UM ANALISTA FINANCEIRO DO SETH VII.

POLÍTICO: ${politicianName}

PROMESSA ANALISADA:
- Texto: "${promise.text}"
- Categoria: ${promise.category}
- Fonte: ${promise.source}
${promise.quote ? `- Citação: "${promise.quote}"` : ''}

PERFIL DE GASTOS DO POLÍTICO:
- Total gasto: R$ ${profile.totalExpenses.toFixed(2)}
- Top 5 categorias:
${profile.topCategories.map((c, i) => `  ${i+1}. ${c.category}: R$ ${c.total.toFixed(2)} (${c.percentage}%)`).join('\n')}

RED FLAGS DETECTADAS:
${profile.redFlags.length > 0 ? profile.redFlags.map(r => `- ${r}`).join('\n') : '- Nenhuma'}

AMOSTRA DE DESPESAS (últimas 20):
${expenses.slice(0, 20).map((e, i) => `${i+1}. [${e.date}] ${e.description}: R$ ${e.value?.toFixed(2) || 'N/A'}`).join('\n')}

INSTRUÇÕES:
1. Analise se os GASTOS estão ALINHADOS com a PROMESSA
2. Uma promessa de "investir em educação" deveria ter gastos relacionados a educação
3. Uma promessa de "reduzir gastos" deveria mostrar contenção de despesas
4. Identifique CONTRADIÇÕES entre promessa e padrão de gastos
5. Considere os red flags na análise

RESPONDA APENAS JSON:
{
  "relatedExpenses": [
    {
      "expenseIndex": 1,
      "relation": "ALINHADO|CONTRADITORIO|NEUTRO",
      "explanation": "explicação"
    }
  ],
  "coherenceScore": 0-100,
  "verdict": "COERENTE|PARCIALMENTE_COERENTE|INCOERENTE|SEM_DADOS",
  "summary": "resumo da análise em 2-3 frases",
  "additionalRedFlags": ["flag1", "flag2"]
}`;

      const response = await aiResilienceNexus.chat(prompt);
      
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logWarn(`[CoherenceExpense] Resposta da IA não contém JSON válido`);
        return this.createEmptyResult(promise, 'Erro ao processar análise.');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Mapear índices para despesas reais
      const relatedExpenses: ExpenseAnalysis[] = (parsed.relatedExpenses || [])
        .filter((re: any) => re.expenseIndex && re.expenseIndex <= expenses.length)
        .map((re: any) => ({
          expense: expenses[re.expenseIndex - 1],
          relation: re.relation || 'NEUTRO',
          explanation: re.explanation || ''
        }));

      // Calcular valor total relacionado
      const totalRelatedValue = relatedExpenses
        .filter(re => re.relation !== 'NEUTRO')
        .reduce((sum, re) => sum + (re.expense.value || 0), 0);

      // Combinar red flags
      const allRedFlags = [
        ...profile.redFlags,
        ...(parsed.additionalRedFlags || [])
      ];

      return {
        promise,
        relatedExpenses,
        totalRelatedValue,
        coherenceScore: parsed.coherenceScore || 50,
        verdict: parsed.verdict || 'SEM_DADOS',
        summary: parsed.summary || 'Análise não disponível.',
        redFlags: allRedFlags
      };

    } catch (error: any) {
      logError(`[CoherenceExpense] Erro ao analisar promessa: ${error.message}`);
      return this.createEmptyResult(promise, 'Erro ao processar análise.');
    }
  }

  /**
   * Cria resultado vazio
   */
  private createEmptyResult(promise: PromiseInput, reason: string): ExpenseCoherenceResult {
    return {
      promise,
      relatedExpenses: [],
      totalRelatedValue: 0,
      coherenceScore: 50,
      verdict: 'SEM_DADOS',
      summary: reason,
      redFlags: []
    };
  }

  /**
   * Cria perfil vazio
   */
  private createEmptyProfile(): ExpenseProfile {
    return {
      totalExpenses: 0,
      byCategory: {},
      topCategories: [],
      redFlags: []
    };
  }

  /**
   * Gera relatório consolidado
   */
  generateReport(results: ExpenseCoherenceResult[], profile: ExpenseProfile): string {
    let report = `
## ANÁLISE DE COERÊNCIA: PROMESSAS vs GASTOS

### Perfil Financeiro
- **Total de Gastos:** R$ ${profile.totalExpenses.toFixed(2)}
- **Principais Categorias:**
${profile.topCategories.map((c, i) => `  ${i+1}. ${c.category}: R$ ${c.total.toFixed(2)} (${c.percentage}%)`).join('\n')}

### Red Flags Detectadas
${profile.redFlags.length > 0 ? profile.redFlags.map(r => `- ⚠️ ${r}`).join('\n') : '- Nenhuma red flag detectada'}

### Análise por Promessa
`;

    for (const result of results) {
      const icon = result.verdict === 'COERENTE' ? '✅' : 
                   result.verdict === 'INCOERENTE' ? '❌' : 
                   result.verdict === 'PARCIALMENTE_COERENTE' ? '⚠️' : '❓';

      report += `
#### ${icon} ${result.promise.text.substring(0, 60)}...
- **Score:** ${result.coherenceScore}%
- **Veredito:** ${result.verdict}
- **Análise:** ${result.summary}
`;

      if (result.redFlags.length > 0) {
        report += `- **Alertas:** ${result.redFlags.join('; ')}\n`;
      }
    }

    return report;
  }
}

export const coherenceExpenseAgent = new CoherenceExpenseAgent();
