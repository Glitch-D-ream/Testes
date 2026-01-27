import { FilteredSource } from './filter.ts';
import { logInfo, logWarn } from '../core/logger.ts';
import { getSupabase } from '../core/database.ts';
import { nanoid } from 'nanoid';

export interface ConsensusResult {
  group_id: string;
  status: 'verified' | 'divergent' | 'pending';
  reliability_score: number;
  consensus_data?: any;
}

export class ConsensusModule {
  /**
   * Analisa um grupo de fontes e determina o consenso entre elas
   */
  async analyzeConsensus(sources: FilteredSource[]): Promise<Map<string, ConsensusResult>> {
    logInfo(`[Consensus] Analisando consenso para ${sources.length} fontes`);
    const results = new Map<string, ConsensusResult>();
    
    // 1. Agrupar fontes por similaridade de conteúdo (Heurística simples)
    const groups = this.groupSourcesBySimilarity(sources);
    
    for (const [groupId, groupSources] of groups) {
      const status = groupSources.length >= 3 ? 'verified' : (groupSources.length > 1 ? 'pending' : 'divergent');
      
      // 2. Calcular score de confiabilidade baseado no tamanho do grupo e reputação das fontes
      const baseScore = this.calculateBaseScore(groupSources);
      
      for (const source of groupSources) {
        results.set(source.url, {
          group_id: groupId,
          status: status,
          reliability_score: baseScore
        });
      }
    }
    
    return results;
  }

  private groupSourcesBySimilarity(sources: FilteredSource[]): Map<string, FilteredSource[]> {
    const groups = new Map<string, FilteredSource[]>();
    const processedUrls = new Set<string>();

    for (let i = 0; i < sources.length; i++) {
      if (processedUrls.has(sources[i].url)) continue;

      const currentGroup: FilteredSource[] = [sources[i]];
      const groupId = nanoid();
      processedUrls.add(sources[i].url);

      for (let j = i + 1; j < sources.length; j++) {
        if (processedUrls.has(sources[j].url)) continue;

        if (this.areSimilar(sources[i].content, sources[j].content)) {
          currentGroup.push(sources[j]);
          processedUrls.add(sources[j].url);
        }
      }
      groups.set(groupId, currentGroup);
    }

    return groups;
  }

  private areSimilar(text1: string, text2: string): boolean {
    // Implementação simples de similaridade (Jaccard ou similar)
    // Para o MVP, vamos usar uma busca por palavras-chave comuns e valores numéricos
    const words1 = new Set(text1.toLowerCase().match(/\w+/g));
    const words2 = new Set(text2.toLowerCase().match(/\w+/g));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    const similarity = intersection.size / union.size;
    
    // Se citarem o mesmo valor numérico (ex: R$ 100 milhões), aumenta a chance de similaridade
    const nums1 = text1.match(/\d+/g) || [];
    const nums2 = text2.match(/\d+/g) || [];
    const commonNums = nums1.filter(n => nums2.includes(n));
    
    return similarity > 0.3 || (commonNums.length > 0 && similarity > 0.15);
  }

  private calculateBaseScore(group: FilteredSource[]): number {
    // Score base: 0.5 para fonte única, 0.8 para 2 fontes, 1.0 para 3+ fontes
    if (group.length >= 3) return 1.0;
    if (group.length === 2) return 0.8;
    return 0.5;
  }

  /**
   * Atualiza a reputação das fontes no banco de dados baseado na divergência
   */
  async updateSourceReputation(sourceName: string, diverged: boolean) {
    const supabase = getSupabase();
    
    const { data: existing } = await supabase
      .from('source_reputation')
      .select('*')
      .eq('source_name', sourceName)
      .single();

    if (existing) {
      const newDivergenceCount = existing.divergence_count + (diverged ? 1 : 0);
      const newTotal = existing.total_contributions + 1;
      // Fórmula simples: reputação cai conforme divergências aumentam
      const newScore = Math.max(0.1, 1.0 - (newDivergenceCount / newTotal));

      await supabase
        .from('source_reputation')
        .update({
          reputation_score: newScore,
          total_contributions: newTotal,
          divergence_count: newDivergenceCount,
          last_updated: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('source_reputation')
        .insert([{
          source_name: sourceName,
          reputation_score: diverged ? 0.8 : 1.0,
          total_contributions: 1,
          divergence_count: diverged ? 1 : 0
        }]);
    }
  }
}

export const consensusModule = new ConsensusModule();
