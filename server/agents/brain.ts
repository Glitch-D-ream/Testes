import { FilteredSource } from './filter.ts';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { getSupabase } from '../core/database.ts';
import { validateBudgetViability, mapPromiseToSiconfiCategory } from '../integrations/siconfi.ts';
import { validateValueAgainstPIB } from '../integrations/ibge.ts';
import { temporalIncoherenceService } from '../services/temporal-incoherence.service.ts';
import { cacheService } from '../services/cache.service.ts';

export class BrainAgent {
  /**
   * O Cérebro Central 4.0 (Operação Tapa-Buraco): Desacoplado e Seguro
   */
  async analyze(politicianName: string, sources: FilteredSource[] = [], userId: string | null = null, existingAnalysisId: string | null = null, ignoreCache: boolean = false) {
    logInfo(`[Brain] Iniciando análise para: ${politicianName}`);
    
    try {
      // FLUXO 1: Perfil Oficial (SEMPRE ATIVO - Sem IA)
      const officialProfile = await this.generateOfficialProfile(politicianName, sources);
      
      // A GRANDE SIMPLIFICAÇÃO: Análise de Intenção suspensa para recalibragem
      let aiAnalysis = "Análise de promessas em discursos e notícias está temporariamente suspensa para recalibragem técnica. Foco atual em dados legislativos e orçamentários oficiais.";
      logInfo(`[Brain] Modo Simplificado: Usando apenas dados oficiais para ${politicianName}.`);

      // Consolidação dos Resultados
      const finalResult = this.consolidateResults(officialProfile, aiAnalysis);
      
      // Sanity Check Final
      this.rejectIfInsane(finalResult);

      // Persistência
      const savedAnalysis = await this.saveAnalysis(finalResult, userId, existingAnalysisId);
      
      return savedAnalysis;
    } catch (error) {
      logError(`[Brain] Falha na análise de ${politicianName}`, error as Error);
      throw error;
    }
  }

  private async generateOfficialProfile(politicianName: string, sources: FilteredSource[]) {
    logInfo(`[Brain] Gerando Perfil Oficial para ${politicianName}`);
    
    const supabase = getSupabase();
    const { data: canonical } = await supabase
      .from('canonical_politicians')
      .select('*')
      .eq('name', politicianName)
      .single();

    let office = 'Político';
    let party = 'N/A';
    let state = 'N/A';

    // Passo 1: Enriquecer Perfil via APIs Oficiais
    if (canonical) {
      if (canonical.camara_id) {
        try {
          const res = await axios.get(`https://dadosabertos.camara.leg.br/api/v2/deputados/${canonical.camara_id}`);
          const data = res.data.dados;
          office = 'Deputado Federal';
          party = data.ultimoStatus.siglaPartido;
          state = data.ultimoStatus.siglaUf;
        } catch (e) { logWarn(`[Brain] Erro ao buscar perfil na Câmara para ${politicianName}`); }
      } else if (canonical.senado_id) {
        try {
          const res = await axios.get(`https://legis.senado.leg.br/dadosabertos/senador/${canonical.senado_id}`, { headers: { 'Accept': 'application/json' } });
          const data = res.data.DetalheParlamentar.Parlamentar;
          office = 'Senador';
          party = data.IdentificacaoParlamentar.SiglaPartidoParlamentar;
          state = data.IdentificacaoParlamentar.UfParlamentar;
        } catch (e) { logWarn(`[Brain] Erro ao buscar perfil no Senado para ${politicianName}`); }
      } else {
        office = canonical.office;
        party = canonical.party;
        state = canonical.state;
      }
    }

    const mainCategory = this.detectMainCategory(sources);
    const siconfiCategory = mapPromiseToSiconfiCategory(mainCategory);
    const currentYear = new Date().getFullYear();
    
    // Passo 2: Dados Governamentais Crus (SICONFI)
    // Para análise federal, usamos o código da União (1) conforme sugerido pelo DeepSeek
    const budgetViability = await validateBudgetViability(siconfiCategory, 500000000, currentYear - 1);
    
    // Passo 3: Histórico Legislativo Real (Projetos de Lei)
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

    const temporalAnalysis = await temporalIncoherenceService.analyzeIncoherence(politicianName, []);

    return {
      politicianName,
      politician: { office, party, state },
      mainCategory,
      budgetViability,
      temporalAnalysis,
      legislativeSummary: temporalAnalysis.summary,
      projects: projects.slice(0, 5), // Top 5 projetos recentes
      timestamp: new Date().toISOString(),
      dataSource: "Dados Abertos (Câmara/Senado/Tesouro Nacional)"
    };
  }

  private async generateAIAnalysis(politicianName: string, sources: FilteredSource[], profile: any) {
    logInfo(`[Brain] Gerando Análise de IA para ${politicianName}`);
    
    const { aiService } = await import('../services/ai.service.ts');
    
    const knowledgeBase = sources
      .map(s => `### ${s.title}\n> ${s.content}`)
      .join('\n\n');

    const prompt = `
      AUDITORIA TÉCNICA: ${politicianName}
      CATEGORIA: ${profile.mainCategory}
      DADOS OFICIAIS: ${profile.budgetViability.reason}
      HISTÓRICO: ${profile.temporalAnalysis.summary}
      
      EVIDÊNCIAS:
      ${knowledgeBase}
      
      Gere um parecer técnico curto (máx 3 parágrafos) sobre a exequibilidade das intenções encontradas.
      Se não houver promessas claras, diga apenas: "Nenhuma promessa explícita detectada nas fontes fornecidas."
    `;

    try {
      const response = await aiService.generateReport(prompt);
      return response;
    } catch (error) {
      logError(`[Brain] Erro na IA`, error as Error);
      return "Análise de IA indisponível no momento.";
    }
  }

  private consolidateResults(profile: any, aiAnalysis: any) {
    return {
      ...profile,
      aiAnalysis: aiAnalysis || "Análise profunda não realizada por falta de evidências textuais.",
      confidence: aiAnalysis ? 85 : 100, // 100% se for apenas dados oficiais
      status: aiAnalysis ? 'full_analysis' : 'official_profile_only'
    };
  }

  private rejectIfInsane(data: any) {
    if (data.confidence > 100) {
      logError(`[SanityCheck] Confidence absurda detectada: ${data.confidence}%`, new Error('SANITY_FAIL'));
      data.confidence = 100; // Força correção
    }
    
    if (!data.politicianName || data.politicianName === 'Autor Desconhecido') {
      throw new Error('SANITY_FAIL: Político não identificado');
    }

    // Evitar o erro de 923% ou métricas impossíveis
    if (data.budgetViability && data.budgetViability.executionRate > 100) {
       logWarn(`[SanityCheck] Taxa de execução absurda corrigida: ${data.budgetViability.executionRate}%`);
       data.budgetViability.executionRate = 100;
    }
  }

  private async saveAnalysis(data: any, userId: string | null, existingId: string | null) {
    const supabase = getSupabase();
    
    // A GRANDE SIMPLIFICAÇÃO: Salvar o objeto 'data' completo no campo 'data_sources' (JSONB)
    // Nota: Usamos 'data_sources' porque a coluna 'results' não existe no schema original do Drizzle.
    const analysisData = {
      user_id: userId,
      author: data.politicianName, // No schema, 'author' é o nome do político
      text: data.aiAnalysis,
      category: data.mainCategory,
      data_sources: data, // Salvando o JSON completo aqui para o frontend
      status: 'completed',
      updated_at: new Date().toISOString()
    };

    if (existingId) {
      logInfo(`[Brain] Atualizando análise existente: ${existingId}`);
      const { error } = await supabase.from('analyses').update(analysisData).eq('id', existingId);
      if (error) logError(`[Brain] Erro ao atualizar análise no Supabase`, error as any);
      return { id: existingId, ...data };
    } else {
      const { nanoid } = await import('nanoid');
      const id = nanoid();
      logInfo(`[Brain] Criando nova análise: ${id}`);
      const { error } = await supabase.from('analyses').insert([{ id, ...analysisData }]);
      if (error) logError(`[Brain] Erro ao inserir análise no Supabase`, error as any);
      return { id, ...data };
    }
  }

  private detectMainCategory(sources: FilteredSource[]): string {
    const text = sources.map(s => (s.title + ' ' + s.content).toLowerCase()).join(' ');
    if (text.includes('saúde')) return 'SAUDE';
    if (text.includes('educação')) return 'EDUCACAO';
    if (text.includes('segurança')) return 'SEGURANCA';
    if (text.includes('economia')) return 'ECONOMIA';
    return 'GERAL';
  }
}

export const brainAgent = new BrainAgent();
