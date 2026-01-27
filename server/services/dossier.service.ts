
import { getSupabase } from '../core/database.ts';
import { logInfo, logError } from '../core/logger.ts';
import { DataCompressor } from '../core/compression.ts';

export interface Dossier {
  politicianName: string;
  summary: {
    totalAnalyses: number;
    averageProbability: number;
    mainCategory: string;
    lastAnalysisDate: string | null;
  };
  canonicalData: any;
  recentAnalyses: any[];
  promisesSummary: {
    total: number;
    byCategory: Record<string, number>;
    highConfidence: number;
  };
}

export class DossierService {
  /**
   * Gera um dossiê consolidado para um político
   */
  async generateDossier(politicianName: string): Promise<Dossier | null> {
    logInfo(`[DossierService] Gerando dossiê para: ${politicianName}`);
    const supabase = getSupabase();
    const cleanName = politicianName.trim();

    try {
      // 1. Buscar dados canônicos
      const { data: canonical } = await supabase
        .from('canonical_politicians')
        .select('*')
        .ilike('name', `%${cleanName}%`)
        .maybeSingle();

      // 2. Buscar todas as análises relacionadas
      const { data: analyses, error: analysesError } = await supabase
        .from('analyses')
        .select('*')
        .ilike('author', `%${cleanName}%`)
        .order('created_at', { ascending: false });

      if (analysesError) throw analysesError;
      if (!analyses || analyses.length === 0) {
        logInfo(`[DossierService] Nenhuma análise encontrada para ${cleanName}`);
        return null;
      }

      // 3. Processar e descomprimir análises
      const processedAnalyses = analyses.map(a => {
        if (a.extracted_promises && DataCompressor.isCompressed(a.extracted_promises as any)) {
          a.extracted_promises = DataCompressor.decompress(a.extracted_promises as any);
        }
        return a;
      });

      // 4. Calcular estatísticas
      const totalAnalyses = processedAnalyses.length;
      const avgProb = processedAnalyses.reduce((acc, a) => acc + (a.probability_score || 0), 0) / totalAnalyses;
      
      const categories = processedAnalyses.map(a => a.category);
      const mainCategory = this.getMostFrequent(categories) || 'GERAL';

      // 5. Consolidar promessas
      const allPromises: any[] = [];
      processedAnalyses.forEach(a => {
        if (Array.isArray(a.extracted_promises)) {
          allPromises.push(...a.extracted_promises);
        }
      });

      const promisesByCategory: Record<string, number> = {};
      allPromises.forEach(p => {
        promisesByCategory[p.category] = (promisesByCategory[p.category] || 0) + 1;
      });

      return {
        politicianName: canonical?.name || cleanName,
        summary: {
          totalAnalyses,
          averageProbability: Math.round(avgProb),
          mainCategory,
          lastAnalysisDate: processedAnalyses[0]?.created_at || null
        },
        canonicalData: canonical || null,
        recentAnalyses: processedAnalyses.slice(0, 5).map(a => ({
          id: a.id,
          date: a.created_at,
          category: a.category,
          score: a.probability_score
        })),
        promisesSummary: {
          total: allPromises.length,
          byCategory: promisesByCategory,
          highConfidence: allPromises.filter(p => p.confidence > 0.8).length
        }
      };
    } catch (error) {
      logError(`[DossierService] Erro ao gerar dossiê para ${politicianName}`, error as Error);
      throw error;
    }
  }

  private getMostFrequent(arr: string[]) {
    if (arr.length === 0) return null;
    const counts: Record<string, number> = {};
    arr.forEach(x => counts[x] = (counts[x] || 0) + 1);
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }
}

export const dossierService = new DossierService();
