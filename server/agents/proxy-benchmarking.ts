
import { getSupabase } from '../core/database.ts';
import { logInfo, logError } from '../core/logger.ts';

export interface ProxyProfile {
  name: string;
  ideology: 'LEFT' | 'RIGHT' | 'CENTER';
  vocation: 'ECONOMY' | 'SOCIAL' | 'INSTITUTIONAL';
  proxies: string[]; // Nomes de políticos com mandato que pensam igual
}

/**
 * ProxyBenchmarkingAgent
 * Para políticos sem mandato (como Jones Manoel), o sistema busca "proxies" 
 * (políticos com mandato e ideologia similar) para projetar como seria a atuação.
 */
export class ProxyBenchmarkingAgent {
  private profiles: Record<string, ProxyProfile> = {
    'Jones Manoel': {
      name: 'Jones Manoel',
      ideology: 'LEFT',
      vocation: 'SOCIAL',
      proxies: ['Erika Hilton', 'Glauber Braga', 'Sâmia Bomfim']
    }
  };

  async getProxyAnalysis(politicianName: string) {
    logInfo(`[ProxyBenchmarking] Gerando análise de proxy para: ${politicianName}`);
    const profile = this.profiles[politicianName];
    
    if (!profile) {
      return {
        message: "Nenhum perfil de proxy definido para este político.",
        projectedAlignment: 50
      };
    }

    const supabase = getSupabase();
    // Buscar médias de votação/atuação dos proxies
    const { data: proxyData } = await supabase
      .from('analyses')
      .select('probability_score, category')
      .in('politician_name', profile.proxies);

    const avgScore = proxyData && proxyData.length > 0
      ? proxyData.reduce((acc, curr) => acc + (curr.probability_score || 0), 0) / proxyData.length
      : 65; // Média padrão para proxies combativos

    return {
      politicianName,
      profileType: 'SEM_MANDATO',
      ideology: profile.ideology,
      proxiesUsed: profile.proxies,
      projectedProbabilityScore: avgScore,
      reasoning: `Análise baseada no comportamento legislativo de seus aliados ideológicos (${profile.proxies.join(', ')}).`
    };
  }
}

export const proxyBenchmarkingAgent = new ProxyBenchmarkingAgent();
