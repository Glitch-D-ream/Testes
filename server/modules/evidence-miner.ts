
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

    const context = sources
      .map((s, i) => `ID: ${i}\nFONTE: ${s.title}\nURL: ${s.url}\nCONTEÚDO: ${s.content.substring(0, 800)}`)
      .join('\n\n---\n\n');

    const prompt = `
Você é um Analista de Inteligência Forense. Sua tarefa é extrair EVIDÊNCIAS BRUTAS sobre o político ${politicianName} a partir das fontes fornecidas.

REGRAS RÍGIDAS:
1. Extraia apenas declarações diretas, promessas específicas ou ações documentadas.
2. Cada evidência DEVE ter uma citação ou resumo fiel do que está no texto.
3. Classifique o impacto de 0 a 100 (relevância para a imagem pública).
4. Se não houver evidência clara, não invente.

FONTES:
${context}

Responda APENAS um JSON no formato:
{
  "evidences": [
    {
      "statement": "Citação ou fato extraído",
      "sourceTitle": "Título da fonte",
      "sourceUrl": "URL da fonte",
      "category": "ECONOMY | SOCIAL | INSTITUTIONAL | RADICALISM",
      "impactScore": 0-100,
      "context": "Breve contexto da declaração"
    }
  ]
}
`;

    try {
      const response = await aiService.generateReport(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return [];

      const data = JSON.parse(jsonMatch[0]);
      return data.evidences || [];
    } catch (error) {
      logError(`[EvidenceMiner] Erro ao minerar evidências:`, error as Error);
      return [];
    }
  }
}

export const evidenceMiner = new EvidenceMiner();
