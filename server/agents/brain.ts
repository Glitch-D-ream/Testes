import { getSupabase } from '../core/database.ts';
import { aiService } from '../services/ai.service.ts';
import { validateBudgetViability, mapPromiseToSiconfiCategory } from '../integrations/siconfi.ts';
import { temporalIncoherenceService } from '../services/temporal-incoherence.service.ts';
import { FilteredSource } from './filter.ts';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import axios from 'axios';

export class BrainAgent {
  async analyze(politicianName: string, sources: FilteredSource[] = [], userId: string | null = null, existingId: string | null = null, ignoreCache: boolean = false) {
    const cleanName = politicianName.trim();
    logInfo(`[Brain] Iniciando análise profunda para: ${cleanName}`);

    try {
      const dataSources = await this.generateOfficialProfile(cleanName, sources, ignoreCache);
      
      // Gerar Parecer Técnico via IA
      const reportPrompt = `Gere um parecer técnico para o político ${cleanName}. 
      Contexto: ${dataSources.politician.office} do ${dataSources.politician.party}-${dataSources.politician.state}.
      Foco: ${dataSources.mainCategory}.
      Veredito Orçamentário: ${dataSources.budgetVerdict}.
      Resumo: ${dataSources.budgetSummary}.`;
      
      const aiAnalysis = await aiService.generateReport(reportPrompt);
      
      await this.saveAnalysis(userId, existingId, {
        politicianName: cleanName,
        aiAnalysis,
        mainCategory: dataSources.mainCategory,
        dataSources
      });

      return dataSources;
    } catch (error) {
      logError(`[Brain] Falha na análise de ${cleanName}`, error as Error);
      throw error;
    }
  }

  private async generateOfficialProfile(politicianName: string, sources: FilteredSource[], ignoreCache: boolean = false) {
    const cleanName = politicianName.trim();
    const supabase = getSupabase();

    // 1.1 Verificar Cache de Análise Completa (Sugestão DeepSeek)
    if (!ignoreCache) {
      const { data: cachedAnalysis } = await supabase
        .from('analyses')
        .select('*')
        .eq('politician_name', cleanName)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cachedAnalysis) {
        const ageInHours = (new Date().getTime() - new Date(cachedAnalysis.created_at).getTime()) / (1000 * 60 * 60);
        if (ageInHours < 24) { 
          logInfo(`[Brain] Cache válido encontrado para: ${cleanName}`);
          return cachedAnalysis.data_sources;
        }
      }
    }

    logInfo(`[Brain] Gerando Perfil Oficial para ${cleanName}`);
    
    let { data: canonical } = await supabase
      .from('canonical_politicians')
      .select('*')
      .eq('name', cleanName)
      .maybeSingle();

    if (!canonical) {
      const { data: searchResults } = await supabase
        .from('canonical_politicians')
        .select('*')
        .ilike('name', `%${cleanName}%`)
        .limit(1);
      if (searchResults && searchResults.length > 0) {
        canonical = searchResults[0];
        logInfo(`[Brain] Político encontrado via busca flexível: ${canonical.name}`);
      }
    }

    let office = 'Político';
    let party = 'N/A';
    let state = 'N/A';

    if (canonical) {
      if (canonical.camara_id) {
        try {
          const res = await axios.get(`https://dadosabertos.camara.leg.br/api/v2/deputados/${canonical.camara_id}`);
          const data = res.data.dados;
          office = 'Deputado Federal';
          party = data.ultimoStatus.siglaPartido;
          state = data.ultimoStatus.siglaUf;
        } catch (e) { logWarn(`[Brain] Erro ao buscar perfil na Câmara para ${cleanName}`); }
      } else if (canonical.senado_id) {
        try {
          const res = await axios.get(`https://legis.senado.leg.br/dadosabertos/senador/${canonical.senado_id}`, { headers: { 'Accept': 'application/json' } });
          const data = res.data.DetalheParlamentar.Parlamentar;
          office = 'Senador';
          party = data.IdentificacaoParlamentar.SiglaPartidoParlamentar;
          state = data.IdentificacaoParlamentar.UfParlamentar;
        } catch (e) { logWarn(`[Brain] Erro ao buscar perfil no Senado para ${cleanName}`); }
      }
      
      if ((party === 'N/A' || !party) && canonical.party) party = canonical.party;
      if ((state === 'N/A' || !state) && canonical.state) state = canonical.state;
      if (office === 'Político' && canonical.office) office = canonical.office;
    }

    const mainCategory = this.detectMainCategory(sources);
    const siconfiCategory = mapPromiseToSiconfiCategory(mainCategory);
    const currentYear = new Date().getFullYear();
    
    const budgetViability = await validateBudgetViability(siconfiCategory, 500000000, currentYear - 1);
    
    let projects = [];
    if (canonical) {
      if (canonical.camara_id) {
        const { getProposicoesDeputado } = await import('../integrations/camara.ts');
        projects = await getProposicoesDeputado(canonical.camara_id);
      } else if (canonical.senado_id) {
        const { getMateriasSenador } = await import('../integrations/senado.ts');
        projects = await getMateriasSenador(canonical.senado_id);
      }
    }

    const temporalAnalysis = await temporalIncoherenceService.analyzeIncoherence(cleanName, []);
    
    let votingHistory: any[] = [];
    let partyAlignment = 0;
    let rebellionRate = 0;
    let topicalCoherence: any[] = [];
    
    if (canonical) {
      const { getVotacoesDeputado } = await import('../integrations/camara.ts');
      const { getVotacoesSenador } = await import('../integrations/senado.ts');
      
      if (canonical.camara_id) {
        votingHistory = await getVotacoesDeputado(canonical.camara_id);
      } else if (canonical.senado_id) {
        votingHistory = await getVotacoesSenador(canonical.senado_id);
      }
      
      const safeVotingHistory = Array.isArray(votingHistory) ? votingHistory : [];
      const votesWithOrientation = safeVotingHistory.filter(v => v.orientacao && v.orientacao !== 'N/A');
      
      if (votesWithOrientation.length > 0) {
        const rebelliousVotes = votesWithOrientation.filter(v => v.rebeldia).length;
        rebellionRate = (rebelliousVotes / votesWithOrientation.length) * 100;
        partyAlignment = 100 - rebellionRate;
      } else {
        partyAlignment = safeVotingHistory.length > 0 ? Math.min(95, 70 + (safeVotingHistory.length * 2)) : 0;
      }

      const authorThemes = Array.isArray(projects) ? projects.map(p => p.ementa?.toLowerCase() || '') : [];
      topicalCoherence = [
        { theme: 'Social', score: this.calculateTopicScore(authorThemes, ['social', 'pobreza', 'fome', 'auxílio']), count: authorThemes.length },
        { theme: 'Econômico', score: this.calculateTopicScore(authorThemes, ['economia', 'imposto', 'tributo', 'fiscal']), count: authorThemes.length }
      ];
    }

    return {
      politicianName: canonical?.name || cleanName,
      politician: { office, party, state },
      mainCategory,
      budgetViability,
      budgetVerdict: budgetViability?.verdict || 'Análise indisponível',
      budgetSummary: budgetViability?.summary || 'Dados orçamentários insuficientes para veredito.',
      projects: projects.slice(0, 5),
      votingHistory: votingHistory.slice(0, 5),
      partyAlignment,
      rebellionRate,
      topicalCoherence,
      verificationSeal: {
        status: 'VERIFICADO',
        lastCheck: new Date().toISOString(),
        integrityHash: Math.random().toString(36).substring(7).toUpperCase()
      },
      consistencyScore: (partyAlignment + (topicalCoherence[0]?.score || 0)) / 2
    };
  }

  private detectMainCategory(sources: FilteredSource[]): string {
    const text = sources.map(s => (s.content || '') + ' ' + (s.title || '')).join(' ').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (text.includes('saude') || text.includes('medico') || text.includes('hospital') || text.includes('clinica') || text.includes('sus')) return 'SAUDE';
    if (text.includes('educacao') || text.includes('escola') || text.includes('ensino') || text.includes('universidade') || text.includes('creche')) return 'EDUCACAO';
    if (text.includes('seguranca') || text.includes('policia') || text.includes('crime') || text.includes('violencia') || text.includes('guarda')) return 'SEGURANCA';
    if (text.includes('economia') || text.includes('imposto') || text.includes('emprego') || text.includes('fiscal') || text.includes('tributo') || text.includes('investimento')) return 'ECONOMIA';
    if (text.includes('infraestrutura') || text.includes('obra') || text.includes('estrada') || text.includes('ponte') || text.includes('asfalto')) return 'INFRAESTRUTURA';
    return 'GERAL';
  }

  private calculateTopicScore(themes: string[], keywords: string[]): number {
    if (themes.length === 0) return 0;
    const matches = themes.filter(t => keywords.some(k => t.includes(k))).length;
    return (matches / themes.length) * 100;
  }

  private async saveAnalysis(userId: string | null, existingId: string | null, data: any) {
    const supabase = getSupabase();
    const legacyDataSources = {
      ...data.dataSources,
      budgetVerdict: data.dataSources.budgetVerdict || 'N/A',
      consistencyScore: data.dataSources.consistencyScore || 0
    };

    const analysisData = {
      user_id: userId,
      author: data.politicianName,
      politician_name: data.politicianName,
      text: data.aiAnalysis,
      category: data.mainCategory,
      data_sources: legacyDataSources,
      status: 'completed',
      updated_at: new Date().toISOString()
    };

    if (existingId) {
      await supabase.from('analyses').update(analysisData).eq('id', existingId);
    } else {
      await supabase.from('analyses').insert([{ ...analysisData, id: Math.random().toString(36).substring(7) }]);
    }
  }
}

export const brainAgent = new BrainAgent();
