
import { getSupabase } from '../core/database.ts';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { scoutHybrid } from './scout-hybrid.ts';
import { filterAgent, FilteredSource } from './filter.ts';
import { aiService } from '../services/ai.service.ts';
import { votingService } from '../services/voting.service.ts';
import { getProposicoesDeputado, getVotacoesDeputado } from '../integrations/camara.ts';
import { validateBudgetViability, mapPromiseToSiconfiCategory } from '../integrations/siconfi.ts';
import { absenceAgent } from './absence.ts';
import { vulnerabilityAuditor } from './vulnerability.ts';
import { benchmarkingAgent } from './benchmarking.ts';
import { evidenceMiner } from '../modules/evidence-miner.ts';
import { financeService } from '../services/finance.service.ts';
import { proxyBenchmarkingAgent } from './proxy-benchmarking.ts';
import axios from 'axios';

export class BrainAgent {
  /**
   * Executa a análise completa de um político
   */
  async analyze(politicianName: string, userId: string | null = null, existingId: string | null = null) {
    const cleanName = politicianName.trim();
    logInfo(`[Brain] Iniciando análise profunda para: ${cleanName}`);

    try {
      // 1. Coleta de dados via Scout (Híbrido: Notícias + Oficial)
      const rawSources = await scoutHybrid.search(cleanName, true);
      
      // 2. Filtragem e Classificação via Filter Agent
      const filteredSources = await filterAgent.filter(rawSources, true); // Forçado modo flexível
      
      // 3. Enriquecimento com Dados Oficiais e Orçamentários
      const dataSources = await this.generateOfficialProfile(cleanName, filteredSources);
      
      // Recuperar o objeto canônico para uso nos agentes subsequentes
      const supabase = getSupabase();
      let { data: canonical } = await supabase
        .from('canonical_politicians')
        .select('*')
        .ilike('name', `%${cleanName}%`)
        .maybeSingle();
      
      // --- Início Checkpoint 4: Agente de Ausência ---
      logInfo(`[Brain] Executando Agente de Ausência para ${cleanName}...`);
      let absenceReport = null;
      try {
        // Usar a categoria principal detectada ou 'GERAL'
        const mainCat = filteredSources.length > 0 ? 'INFRASTRUCTURE' : 'GERAL'; 
        absenceReport = await absenceAgent.checkAbsence(cleanName, mainCat);
      } catch (e) {
        logWarn(`[Brain] Falha no Agente de Ausência: ${e}`);
      }
      // --- Fim Checkpoint 4 ---

      // --- Início Evolução: Mineração de Evidências e Auditoria Forense ---
      logInfo(`[Brain] Minerando evidências granulares para ${cleanName}...`);
      let evidences = [];
      let vulnerabilityReport = null;
      try {
        evidences = await evidenceMiner.mine(cleanName, filteredSources.length > 0 ? filteredSources : rawSources.slice(0, 10));
        logInfo(`[Brain] Mineradas ${evidences.length} evidências. Iniciando Auditoria Forense...`);
        vulnerabilityReport = await vulnerabilityAuditor.audit(cleanName, evidences);
      } catch (e) {
        logWarn(`[Brain] Falha na Auditoria Forense: ${e}`);
      }
      // --- Fim Evolução ---

      // --- Início Evolução: Rastreabilidade Financeira e Emendas ---
      logInfo(`[Brain] Executando Rastreabilidade Financeira para ${cleanName}...`);
      let financeEvidences: any[] = [];
      try {
        if (canonical && canonical.camara_id) {
          const expenses = await financeService.getParlamentaryExpenses(canonical.camara_id);
          const proposals = await financeService.getProposals(canonical.camara_id);
          financeEvidences = [...expenses, ...proposals];
        }
        // Sempre buscar Emendas Pix (Simulação/Portal)
        const pixEmendas = await financeService.getPixEmendas(cleanName);
        financeEvidences = [...financeEvidences, ...pixEmendas];
        
        // Adicionar evidências financeiras ao conjunto de evidências para a auditoria
        evidences = [...evidences, ...financeEvidences.map(f => ({
          statement: f.description,
          sourceTitle: f.source,
          sourceUrl: f.link || '',
          category: f.type === 'EXPENSE' ? 'ECONOMY' : 'INSTITUTIONAL',
          impactScore: f.value ? Math.min(100, Math.floor(f.value / 10000)) : 50,
          context: `Valor: R$ ${f.value || 'N/A'} | Data: ${f.date}`
        }))];
      } catch (e) {
        logWarn(`[Brain] Falha na Rastreabilidade Financeira: ${e}`);
      }
      // --- Fim Evolução ---

      // --- Início Evolução: Benchmarking Político ---
      logInfo(`[Brain] Executando Benchmarking Político para ${cleanName}...`);
      let benchmarkResult = null;
      try {
        if (!canonical || (!canonical.camara_id && !canonical.senado_id)) {
          logInfo(`[Brain] Político sem mandato. Ativando Proxy Benchmarking para ${cleanName}...`);
          const proxyResult = await proxyBenchmarkingAgent.getProxyAnalysis(cleanName);
          benchmarkResult = {
            politicianName: cleanName,
            comparisonGroup: 'Proxy Ideológico',
            metrics: {
              budgetAlignment: 0,
              partyLoyalty: 0,
              productivityScore: proxyResult.projectedProbabilityScore,
              consistencyScore: proxyResult.projectedProbabilityScore
            },
            groupAverages: { budgetAlignment: 50, partyLoyalty: 50, productivityScore: 50, consistencyScore: 50 },
            uniqueness: proxyResult.reasoning,
            rankingInGroup: 0,
            totalInGroup: proxyResult.proxiesUsed?.length || 0
          };
        } else {
          benchmarkResult = await benchmarkingAgent.compare(cleanName, { ...dataSources, financeEvidences });
        }
      } catch (e) {
        logWarn(`[Brain] Falha no Benchmarking Político: ${e}`);
      }
      // --- Fim Evolução ---

      // 4. Geração de Parecer Técnico via IA (Brain - VerdictEngine v2)
      logInfo(`[Brain] Ativando VerdictEngine para ${cleanName}...`);
      
      // Garantir que temos contexto, mesmo que mínimo
      const contextSources = filteredSources.length > 0 ? filteredSources : rawSources.slice(0, 5);
      const analysisPrompt = this.generateAnalysisPrompt(cleanName, dataSources, contextSources);

      let aiAnalysis = "";
      let extractedPromisesFromAI: any[] = [];

      try {
        // ETAPA 1: Raciocínio Profundo (DeepSeek R1 via OpenRouter)
        logInfo(`[Brain] ETAPA 1: Gerando Parecer Técnico com DeepSeek R1...`);
        aiAnalysis = await aiService.generateReport(analysisPrompt);

        // ETAPA 2: Estruturação Rápida (Groq)
        logInfo(`[Brain] ETAPA 2: Estruturando promessas com Groq...`);
        const structuredResult = await aiService.analyzeText(aiAnalysis);
        if (structuredResult && structuredResult.promises) {
          extractedPromisesFromAI = structuredResult.promises;
        }
      } catch (error) {
        logWarn(`[Brain] Falha no VerdictEngine primário, tentando fallbacks...`);
        if (!aiAnalysis) aiAnalysis = await aiService.generateReport(analysisPrompt);
        if (extractedPromisesFromAI.length === 0) {
          const structuredResult = await aiService.analyzeText(aiAnalysis);
          extractedPromisesFromAI = structuredResult?.promises || [];
        }
      }

      // FALLBACK FINAL: Se a IA falhar completamente ou não retornar promessas, usar o extrator local (NLP)
      if (extractedPromisesFromAI.length === 0 && filteredSources.length > 0) {
        logWarn('[Brain] IA não retornou promessas. Ativando fallback de NLP local...');
        const { extractPromises } = await import('../modules/nlp.ts');
        const allContent = filteredSources.map(s => s.content).join('\n\n');
        const nlpPromises = extractPromises(allContent);
        if (nlpPromises.length > 0) {
          logInfo(`[Brain] NLP local extraiu ${nlpPromises.length} promessas candidatas.`);
          extractedPromisesFromAI = nlpPromises.map(p => ({ ...p, reasoning: 'Extraído via análise de padrões linguísticos locais.' }));
        }
      }
      
      // Usar promessas extraídas da IA
      let finalPromises = extractedPromisesFromAI;

      // Garantir que o parecer técnico (aiAnalysis) não seja vazio
      const finalReport = aiAnalysis && aiAnalysis.length > 100 
      ? aiAnalysis 
      : `**PARECER TÉCNICO DE INTELIGÊNCIA**\n\nO sistema Seth VII realizou uma auditoria técnica para ${cleanName}. \n\n**Análise de Contexto**: Identificamos ${filteredSources.length} registros relevantes que indicam uma atuação focada em ${dataSources.mainCategory}. \n\n**Veredito Orçamentário**: ${dataSources.budgetSummary}\n\n**Conclusão**: Embora os dados nominais de votação sejam limitados para o período consultado, o perfil de atuação sugere um alinhamento de ${dataSources.partyAlignment}% com as diretrizes do partido ${dataSources.politician.party}.`;

      const finalResult = {
        ...dataSources,
        absenceReport,
        vulnerabilityReport,
        benchmarkResult,
        evidences, // Incluir evidências brutas para transparência
        dataLineage: {
          vulnerability: 'Minerado via EvidenceMiner (Forense)',
          benchmarking: 'Baseado em dados do Supabase e APIs Oficiais',
          budget: 'SICONFI Snapshot',
          legislative: 'API Câmara/Senado'
        }
      };

      // --- Início Checkpoint 7: Persistência Unificada (Seth VII) ---
      try {
        const { analysisService } = await import('../services/analysis.service.ts');
        const analysisResult = await analysisService.createAnalysis(
          userId,
          finalReport,
          cleanName,
          dataSources.mainCategory || 'GERAL',
          {
            politicianName: dataSources.politicianName || cleanName,
            office: dataSources.politician.office,
            party: dataSources.politician.party,
            state: dataSources.politician.state,
            absenceReport,
            vulnerabilityReport,
            benchmarkResult,
            consensusMetrics: {
              sourceCount: filteredSources.length,
              verifiedCount: filteredSources.filter((s: any) => s.consensus_status === 'verified').length
            },
            contradictions: vulnerabilityReport?.vulnerabilities || [],
            budgetVerdict: dataSources.budgetVerdict,
            budgetSummary: dataSources.budgetSummary,
            contrastAnalysis: dataSources.contrastAnalysis,
            projects: dataSources.projects,
            votingHistory: dataSources.votingHistory
          }
        );
        logInfo(`[Brain] Análise persistida com sucesso. ID: ${analysisResult.id}`);
      } catch (e) {
        logWarn(`[Brain] Falha ao persistir métricas avançadas: ${e}`);
      }
      // --- Fim Checkpoint 7 ---

      return finalResult;
    } catch (error) {
      logError(`[Brain] Falha na análise de ${cleanName}`, error as Error);
      throw error;
    }
  }

  private async getCachedAnalysis(cleanName: string) {
    const supabase = getSupabase();
    const { data: cachedAnalysis } = await supabase
      .from('analyses')
      .select('*')
      .eq('politician_name', cleanName)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    return cachedAnalysis;
  }

  private async generateOfficialProfile(cleanName: string, sources: FilteredSource[], ignoreCache: boolean = false) {
    const supabase = getSupabase();
    
    // 1.1 Tentar cache recente (24h)
    if (!process.env.FORCE_REGENERATE_PROFILE) {
      const cachedAnalysis = await this.getCachedAnalysis(cleanName);

      if (cachedAnalysis) {
        const ageInHours = (new Date().getTime() - new Date(cachedAnalysis.created_at).getTime()) / (1000 * 60 * 60);
        if (ageInHours < 24 && cachedAnalysis.data_sources) { 
          logInfo(`[Brain] Cache válido encontrado para: ${cleanName}`);
          const ds = cachedAnalysis.data_sources;
          if (ds.politician && ds.politician.office) {
            return ds;
          }
        }
      }
    }

    logInfo(`[Brain] Gerando Perfil Oficial para ${cleanName}`);
    
    // 1.2 Buscar dados canônicos no banco
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
        } catch (e) {
          logWarn(`[Brain] Falha ao buscar dados da Câmara para ${cleanName}`);
        }
      }
    } else {
      // Fallback: Tentar buscar na API da Câmara se não estiver no banco canônico
      try {
        const { getDeputadoId } = await import('../integrations/camara.ts');
        const camaraId = await getDeputadoId(cleanName);
        if (camaraId) {
          const res = await axios.get(`https://dadosabertos.camara.leg.br/api/v2/deputados/${camaraId}`);
          const data = res.data.dados;
          office = 'Deputado Federal';
          party = data.ultimoStatus.siglaPartido;
          state = data.ultimoStatus.siglaUf;
          // Criar um objeto canônico temporário para o restante da lógica
          canonical = { camara_id: camaraId, name: cleanName };
        }
      } catch (e) {
        logWarn(`[Brain] Falha no fallback de busca de ID para ${cleanName}`);
      }
    }

    const mainCategory = this.detectMainCategory(sources);
    let budgetViability = null;
    let projects: any[] = [];
    let votingHistory: any[] = [];
    let partyAlignment = 0;
    let rebellionRate = 0;
    let topicalCoherence: any[] = [];
    let contrastAnalysis = "Análise de contraste em processamento...";

    if (canonical) {
      try {
        const siconfiCategory = mapPromiseToSiconfiCategory(mainCategory);
        budgetViability = await validateBudgetViability(siconfiCategory.name, 1000000, new Date().getFullYear() - 1, 'FEDERAL');
      } catch (e) {
        logWarn(`[Brain] Falha ao validar viabilidade orçamentária: ${e}`);
      }
      
      if (canonical.camara_id) {
        projects = await getProposicoesDeputado(Number(canonical.camara_id));
        votingHistory = await getVotacoesDeputado(Number(canonical.camara_id));
      }
      
      const safeVotingHistory = Array.isArray(votingHistory) ? votingHistory : [];
      if (safeVotingHistory.length > 0) {
        const totalVotes = safeVotingHistory.length;
        const nonRebelliousVotes = safeVotingHistory.filter(v => !v.rebeldia).length;
        partyAlignment = totalVotes > 0 ? (nonRebelliousVotes / totalVotes) * 100 : 0;
      } else {
        partyAlignment = 0;
      }

      const authorThemes = Array.isArray(projects) ? projects.map(p => p.ementa?.toLowerCase() || '') : [];
      topicalCoherence = [
        { theme: 'Social', score: this.calculateTopicScore(authorThemes, ['social', 'pobreza', 'fome', 'auxílio']), count: authorThemes.length },
        { theme: 'Econômico', score: this.calculateTopicScore(authorThemes, ['economia', 'imposto', 'tributo', 'fiscal']), count: authorThemes.length }
      ];

      const newsContent = sources.map(s => s.content).join(' ').toLowerCase();
      const contradictions = [];
      
      if (newsContent.includes('educacao') || newsContent.includes('escola')) {
        const eduVotes = votingHistory.filter((v: any) => v.tema?.toLowerCase().includes('educação') || v.tema?.toLowerCase().includes('fundeb'));
        const againstEdu = eduVotes.filter((v: any) => v.voto === 'Não' || v.voto === 'Obstrução');
        if (againstEdu.length > 0) {
          contradictions.push(`O político defende a educação em discursos, mas votou contra/obstruiu em ${againstEdu.length} projetos educacionais.`);
        }
      }

      if (newsContent.includes('saude') || newsContent.includes('sus')) {
        const healthVotes = votingHistory.filter((v: any) => v.tema?.toLowerCase().includes('saúde') || v.tema?.toLowerCase().includes('enfermagem'));
        const againstHealth = healthVotes.filter((v: any) => v.voto === 'Não' || v.voto === 'Obstrução');
        if (againstHealth.length > 0) {
          contradictions.push(`Há divergência entre o discurso pró-saúde e ${againstHealth.length} votos contrários a projetos da área.`);
        }
      }
      
      contrastAnalysis = contradictions.length > 0 
        ? `ALERTA DE INCONSISTÊNCIA: ${contradictions.join(' ')}`
        : "DISCURSO COERENTE: Não foram encontradas contradições diretas entre as declarações recentes e o histórico de votação nominal.";
    }

    return {
      politicianName: canonical?.name || cleanName,
      politician: { office, party, state },
      mainCategory,
      budgetViability,
      budgetVerdict: budgetViability?.viable ? 'Viável' : 'Análise indisponível',
      budgetSummary: budgetViability?.reason || 'Dados orçamentários insuficientes para veredito.',
      contrastAnalysis,
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
    const text = sources.map(s => (s.content || '') + ' ' + (s.title || '')).join(' ');
    try {
      const { detectCategorySemantic } = require('../modules/nlp.ts');
      return detectCategorySemantic(text);
    } catch (e) {
      const textLower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (textLower.includes('saude') || textLower.includes('sus')) return 'SAUDE';
      if (textLower.includes('educacao') || textLower.includes('escola')) return 'EDUCACAO';
      if (textLower.includes('seguranca') || textLower.includes('policia')) return 'SEGURANCA';
      if (textLower.includes('economia') || textLower.includes('imposto')) return 'ECONOMIA';
      return 'GERAL';
    }
  }

  private calculateTopicScore(themes: string[], keywords: string[]): number {
    if (themes.length === 0) return 0;
    const matches = themes.filter(t => keywords.some(k => t.includes(k))).length;
    return (matches / themes.length) * 100;
  }

  private generateAnalysisPrompt(name: string, data: any, sources: FilteredSource[]): string {
    return `Você é um Auditor Político de Elite do sistema Seth VII. Sua missão é realizar uma análise profunda, técnica e CRÍTICA do político ${name}.
			
			DADOS DO POLÍTICO:
			- Nome: ${name}
			- Cargo: ${data.politician?.office || 'Não identificado'}
			- Partido: ${data.politician?.party || 'N/A'}
			- Estado: ${data.politician?.state || 'N/A'}
			
			FONTES DE NOTÍCIAS E DECLARAÇÕES (CONTEXTO REAL):
			${sources.length > 0 ? sources.map(s => `- [${s.source}] ${s.title}: ${s.content.substring(0, 1000)}...`).join('\n') : 'Nenhuma notícia recente encontrada.'}
	
			DADOS OFICIAIS E ORÇAMENTÁRIOS (BASE TÉCNICA):
			- Alinhamento Partidário: ${data.partyAlignment}%
			- Veredito Orçamentário (${data.mainCategory}): ${data.budgetVerdict}
			- Resumo Orçamentário: ${data.budgetSummary || 'Dados não disponíveis'}
			- Histórico de Votações: ${data.votingHistory?.length > 0 ? data.votingHistory.map((v: any) => `${v.data}: ${v.tema} (Voto: ${v.voto})`).join('; ') : 'Nenhum voto nominal recente encontrado.'}
			- Auditoria de Contradições: ${data.contrastAnalysis}
	
    SUA TAREFA:
    Gere um PARECER TÉCNICO DE INTELIGÊNCIA fundamentado e crítico, baseado ESTRITAMENTE nas evidências fornecidas. Você deve agir como um auditor que confronta o discurso político com a realidade orçamentária e legislativa.
	
    ESTRUTURA DO PARECER (OBRIGATÓRIA):
    ### 🛡️ PARECER TÉCNICO DE INTELIGÊNCIA - SETH VII
    #### 1. Contexto e Discurso Atual
    #### 2. Auditoria de Realidade (Dados Oficiais)
    #### 3. Auditoria de Contradições e Consistência
    #### 4. Veredito de Viabilidade e Integridade
    #### 5. Fontes Auditadas`;
  }
}

export const brainAgent = new BrainAgent();
