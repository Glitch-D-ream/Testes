
import { aiService } from '../services/ai.service.ts';
import { logInfo, logError } from '../core/logger.ts';

export interface Evidence {
  statement: string;
  sourceTitle: string;
  sourceUrl: string;
  category: 'ECONOMY' | 'SOCIAL' | 'INSTITUTIONAL' | 'RADICALISM';
  impactScore: number;
  context: string;
}

/**
 * EvidenceMiner - Extrai citações e fatos granulares das fontes brutas
 * Evita generalizações e foca no que foi REALMENTE dito ou feito.
 */
export class EvidenceMiner {
  async mine(politicianName: string, sources: any[]): Promise<Evidence[]> {
    logInfo(`[EvidenceMiner] Minerando evidências para: ${politicianName} em ${sources.length} fontes.`);

    const validUrls = sources.map(s => s.url);
    const context = sources
      .map((s, i) => `ID: ${i}\nFONTE: ${s.title}\nURL: ${s.url}\nCONTEÚDO: ${s.content.substring(0, 800)}`)
      .join('\n\n---\n\n');

    const prompt = `
Você é um Analista de Inteligência Forense. Sua tarefa é extrair EVIDÊNCIAS BRUTAS sobre o político ${politicianName} estritamente a partir das fontes fornecidas.

REGRAS DE OURO (OBRIGATÓRIO):
1. PROIBIDO ALUCINAR: Use apenas informações presentes nas fontes abaixo.
2. VALIDAÇÃO DE URL: A "sourceUrl" deve ser EXATAMENTE uma das URLs fornecidas na lista de fontes. Não invente URLs.
3. CITAÇÃO DIRETA: Priorize extrair frases entre aspas ou declarações explícitas.
4. CATEGORIA RADICALISMO: Identifique discursos de ódio, ataques a instituições ou retórica extremista.

FONTES PERMITIDAS:
${context}

Responda APENAS um JSON no formato:
{
  "evidences": [
    {
      "statement": "Citação ou fato extraído do texto",
      "sourceTitle": "Título da fonte original",
      "sourceUrl": "URL exata presente na fonte",
      "category": "ECONOMY | SOCIAL | INSTITUTIONAL | RADICALISM",
      "impactScore": 0-100,
      "context": "Contexto técnico da declaração"
    }
  ]
}
`;

    try {
      const response = await aiService.generateReport(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return [];

      const data = JSON.parse(jsonMatch[0]);
      const rawEvidences = data.evidences || [];
      
      // Validação estrita: Filtrar evidências que usam URLs não fornecidas (combate alucinação)
      return rawEvidences.filter((ev: any) => {
        const isValid = validUrls.includes(ev.sourceUrl);
        if (!isValid) logWarn(`[EvidenceMiner] Descartando evidência com URL alucinada: ${ev.sourceUrl}`);
        return isValid;
      });
    } catch (error) {
      logError(`[EvidenceMiner] Erro ao minerar evidências:`, error as Error);
      return [];
    }
  }
}

export const evidenceMiner = new EvidenceMiner();
