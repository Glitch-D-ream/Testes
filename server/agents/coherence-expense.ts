/**
 * Coherence Expense Agent v2.0 - INCISIVO
 * 
 * Cruza promessas com gastos da cota parlamentar
 * COM ANÁLISE PROFUNDA: fornecedores, padrões suspeitos, comparativos
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
  coherenceScore: number;
  verdict: 'COERENTE' | 'PARCIALMENTE_COERENTE' | 'INCOERENTE' | 'SEM_DADOS';
  summary: string;
  redFlags: string[];
  deepAnalysis: {
    alignmentWithPromise: string;
    spendingPriorities: string;
    supplierAnalysis: string;
    comparisonWithPeers: string;
    citizenImpact: string;
  };
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
  topSuppliers: { name: string; total: number; count: number }[];
  redFlags: string[];
  suspiciousPatterns: Array<{
    type: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    evidence: string;
  }>;
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
      const deputadoId = await getDeputadoId(politicianName);
      if (!deputadoId) {
        logWarn(`[CoherenceExpense] Deputado não encontrado: ${politicianName}`);
        return {
          results: promises.map(p => this.createEmptyResult(p, 'Político não encontrado na base da Câmara.')),
          profile: this.createEmptyProfile()
        };
      }

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

      const profile = this.createExpenseProfile(allExpenses);

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
   * Cria perfil consolidado de gastos com detecção de padrões suspeitos
   */
  private createExpenseProfile(expenses: FinanceEvidence[]): ExpenseProfile {
    const byCategory: Record<string, { total: number; count: number }> = {};
    const bySupplier: Record<string, { total: number; count: number }> = {};
    const valueFrequency: Record<number, number> = {};
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

      // Rastrear fornecedores
      const supplier = expense.source || 'NÃO INFORMADO';
      if (!bySupplier[supplier]) {
        bySupplier[supplier] = { total: 0, count: 0 };
      }
      bySupplier[supplier].total += value;
      bySupplier[supplier].count += 1;

      // Rastrear frequência de valores
      if (value > 100) {
        const roundedValue = Math.round(value * 100) / 100;
        valueFrequency[roundedValue] = (valueFrequency[roundedValue] || 0) + 1;
      }
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

    // Top fornecedores
    const topSuppliers = Object.entries(bySupplier)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Detectar red flags e padrões suspeitos
    const redFlags: string[] = [];
    const suspiciousPatterns: ExpenseProfile['suspiciousPatterns'] = [];
    
    // 1. Concentração excessiva em uma categoria
    const topCategory = topCategories[0];
    if (topCategory && topCategory.percentage > 50) {
      redFlags.push(`${topCategory.percentage}% dos gastos concentrados em "${topCategory.category}"`);
      suspiciousPatterns.push({
        type: 'CONCENTRAÇÃO_EXCESSIVA',
        description: `Mais da metade dos gastos em uma única categoria`,
        severity: topCategory.percentage > 70 ? 'HIGH' : 'MEDIUM',
        evidence: `${topCategory.category}: R$ ${topCategory.total.toFixed(2)} (${topCategory.percentage}%)`
      });
    }

    // 2. Gastos com combustíveis muito altos
    const combustiveis = byCategoryWithPercentage['COMBUSTÍVEIS E LUBRIFICANTES.'];
    if (combustiveis && combustiveis.percentage > 30) {
      redFlags.push(`Gastos elevados com combustíveis: ${combustiveis.percentage}% do total`);
      suspiciousPatterns.push({
        type: 'COMBUSTÍVEIS_ELEVADOS',
        description: `Gastos com combustíveis acima da média`,
        severity: combustiveis.percentage > 50 ? 'HIGH' : 'MEDIUM',
        evidence: `R$ ${combustiveis.total.toFixed(2)} (${combustiveis.percentage}%)`
      });
    }

    // 3. Valores repetidos (possível fracionamento)
    for (const [value, count] of Object.entries(valueFrequency)) {
      if (count >= 5) {
        redFlags.push(`Valor R$ ${Number(value).toFixed(2)} aparece ${count} vezes (possível padrão suspeito)`);
        suspiciousPatterns.push({
          type: 'VALORES_REPETIDOS',
          description: `Mesmo valor aparece múltiplas vezes - possível fracionamento`,
          severity: count >= 10 ? 'HIGH' : 'MEDIUM',
          evidence: `R$ ${value} x ${count} ocorrências`
        });
      }
    }

    // 4. Fornecedor dominante
    if (topSuppliers[0] && (topSuppliers[0].total / totalExpenses) > 0.3) {
      const supplierPercentage = Math.round((topSuppliers[0].total / totalExpenses) * 100);
      redFlags.push(`Fornecedor "${topSuppliers[0].name}" recebeu ${supplierPercentage}% do total`);
      suspiciousPatterns.push({
        type: 'FORNECEDOR_DOMINANTE',
        description: `Um único fornecedor concentra grande parte dos pagamentos`,
        severity: supplierPercentage > 50 ? 'HIGH' : 'MEDIUM',
        evidence: `${topSuppliers[0].name}: R$ ${topSuppliers[0].total.toFixed(2)} (${supplierPercentage}%)`
      });
    }

    return {
      totalExpenses,
      byCategory: byCategoryWithPercentage,
      topCategories,
      topSuppliers,
      redFlags,
      suspiciousPatterns
    };
  }

  /**
   * Analisa uma promessa específica contra os gastos - VERSÃO INCISIVA
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
═══════════════════════════════════════════════════════════════════════════════
ANÁLISE FORENSE DE GASTOS PARLAMENTARES - SETH VII v2.0
═══════════════════════════════════════════════════════════════════════════════

VOCÊ É UM AUDITOR FINANCEIRO ESPECIALIZADO EM GASTOS PÚBLICOS.
SUA MISSÃO: Identificar INCOERÊNCIAS entre o que o político PROMETE e como ele GASTA dinheiro público.

═══════════════════════════════════════════════════════════════════════════════
POLÍTICO ALVO: ${politicianName}
═══════════════════════════════════════════════════════════════════════════════

PROMESSA ANALISADA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Texto: "${promise.text}"
Categoria: ${promise.category}
Fonte: ${promise.source}
${promise.quote ? `Citação direta: "${promise.quote}"` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERFIL FINANCEIRO DO POLÍTICO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total de Gastos: R$ ${profile.totalExpenses.toFixed(2)}

TOP 5 CATEGORIAS DE GASTOS:
${profile.topCategories.map((c, i) => `${i+1}. ${c.category}: R$ ${c.total.toFixed(2)} (${c.percentage}%)`).join('\n')}

TOP 10 FORNECEDORES:
${profile.topSuppliers.map((s, i) => `${i+1}. ${s.name}: R$ ${s.total.toFixed(2)} (${s.count} pagamentos)`).join('\n')}

RED FLAGS JÁ IDENTIFICADAS:
${profile.redFlags.map(r => `⚠️ ${r}`).join('\n')}

PADRÕES SUSPEITOS:
${profile.suspiciousPatterns.map(p => `🚨 [${p.severity}] ${p.type}: ${p.description} | ${p.evidence}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AMOSTRA DE DESPESAS (últimas 20):
${expenses.slice(0, 20).map((e, i) => `
[${i+1}] ${e.date || 'N/A'} | ${e.description}
    Fonte: ${e.source}
    Valor: R$ ${e.value?.toFixed(2) || 'N/A'}
`).join('')}

═══════════════════════════════════════════════════════════════════════════════
INSTRUÇÕES DE ANÁLISE FORENSE:
═══════════════════════════════════════════════════════════════════════════════

1. ALINHAMENTO PROMESSA vs GASTO:
   - Os gastos estão ALINHADOS com a promessa?
   - Se promete "investir em educação", há gastos relacionados a educação?
   - Se promete "austeridade", os gastos são compatíveis?

2. ANÁLISE DE FORNECEDORES:
   - Quem são os principais fornecedores?
   - Há concentração suspeita em poucos fornecedores?
   - Há possível conexão com o político ou aliados?

3. PADRÕES SUSPEITOS:
   - Há fracionamento de despesas (valores repetidos)?
   - Há gastos próximos ao limite para evitar fiscalização?

4. COMPARATIVO:
   - Como esses gastos se comparam com outros deputados?
   - Está acima ou abaixo da média?

5. IMPACTO NO CIDADÃO:
   - Esses gastos beneficiam o cidadão?
   - O dinheiro público está sendo bem utilizado?

═══════════════════════════════════════════════════════════════════════════════
RESPONDA APENAS JSON (seja INCISIVO e aponte TODAS as irregularidades):
═══════════════════════════════════════════════════════════════════════════════

{
  "relatedExpenses": [
    {
      "expenseIndex": número,
      "relation": "ALINHADO|CONTRADITORIO|NEUTRO",
      "explanation": "explicação detalhada"
    }
  ],
  "coherenceScore": 0-100,
  "verdict": "COERENTE|PARCIALMENTE_COERENTE|INCOERENTE|SEM_DADOS",
  "summary": "resumo INCISIVO da análise em 3-4 frases",
  "additionalRedFlags": ["flag1", "flag2"],
  "deepAnalysis": {
    "alignmentWithPromise": "análise detalhada do alinhamento entre gastos e promessa",
    "spendingPriorities": "quais são as reais prioridades de gasto do político",
    "supplierAnalysis": "análise crítica dos fornecedores - há algo suspeito?",
    "comparisonWithPeers": "como se compara com outros políticos do mesmo cargo",
    "citizenImpact": "como esses gastos afetam o cidadão comum"
  }
}`;

      const response = await aiResilienceNexus.chat(prompt);
      
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logWarn(`[CoherenceExpense] Resposta da IA não contém JSON válido`);
        return this.createEmptyResult(promise, 'Erro ao processar análise.');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      const relatedExpenses: ExpenseAnalysis[] = (parsed.relatedExpenses || [])
        .filter((re: any) => re.expenseIndex && re.expenseIndex <= expenses.length)
        .map((re: any) => ({
          expense: expenses[re.expenseIndex - 1],
          relation: re.relation || 'NEUTRO',
          explanation: re.explanation || ''
        }));

      const totalRelatedValue = relatedExpenses
        .filter(re => re.relation !== 'NEUTRO')
        .reduce((sum, re) => sum + (re.expense.value || 0), 0);

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
        redFlags: allRedFlags,
        deepAnalysis: parsed.deepAnalysis || {
          alignmentWithPromise: 'N/A',
          spendingPriorities: 'N/A',
          supplierAnalysis: 'N/A',
          comparisonWithPeers: 'N/A',
          citizenImpact: 'N/A'
        }
      };

    } catch (error: any) {
      logError(`[CoherenceExpense] Erro ao analisar promessa: ${error.message}`);
      return this.createEmptyResult(promise, 'Erro ao processar análise.');
    }
  }

  private createEmptyResult(promise: PromiseInput, reason: string): ExpenseCoherenceResult {
    return {
      promise,
      relatedExpenses: [],
      totalRelatedValue: 0,
      coherenceScore: 50,
      verdict: 'SEM_DADOS',
      summary: reason,
      redFlags: [],
      deepAnalysis: {
        alignmentWithPromise: 'N/A',
        spendingPriorities: 'N/A',
        supplierAnalysis: 'N/A',
        comparisonWithPeers: 'N/A',
        citizenImpact: 'N/A'
      }
    };
  }

  private createEmptyProfile(): ExpenseProfile {
    return {
      totalExpenses: 0,
      byCategory: {},
      topCategories: [],
      topSuppliers: [],
      redFlags: [],
      suspiciousPatterns: []
    };
  }

  generateReport(results: ExpenseCoherenceResult[], profile: ExpenseProfile): string {
    let report = `
## ANÁLISE FORENSE DE GASTOS PARLAMENTARES

### Perfil Financeiro
- **Total de Gastos:** R$ ${profile.totalExpenses.toFixed(2)}
- **Principais Categorias:**
${profile.topCategories.map((c, i) => `  ${i+1}. ${c.category}: R$ ${c.total.toFixed(2)} (${c.percentage}%)`).join('\n')}

### Top Fornecedores
${profile.topSuppliers.slice(0, 5).map((s, i) => `  ${i+1}. ${s.name}: R$ ${s.total.toFixed(2)} (${s.count} pagamentos)`).join('\n')}

### Red Flags Detectadas
${profile.redFlags.length > 0 ? profile.redFlags.map(r => `- ⚠️ ${r}`).join('\n') : '- Nenhuma red flag detectada'}

### Padrões Suspeitos
${profile.suspiciousPatterns.length > 0 ? profile.suspiciousPatterns.map(p => `- 🚨 [${p.severity}] ${p.type}: ${p.description}`).join('\n') : '- Nenhum padrão suspeito detectado'}

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

**Análise Profunda:**
- Alinhamento: ${result.deepAnalysis.alignmentWithPromise}
- Prioridades: ${result.deepAnalysis.spendingPriorities}
- Fornecedores: ${result.deepAnalysis.supplierAnalysis}
- Impacto: ${result.deepAnalysis.citizenImpact}
`;

      if (result.redFlags.length > 0) {
        report += `- **Alertas:** ${result.redFlags.join('; ')}\n`;
      }
    }

    return report;
  }
}

export const coherenceExpenseAgent = new CoherenceExpenseAgent();
