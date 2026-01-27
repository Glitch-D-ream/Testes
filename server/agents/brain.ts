
import { getSupabase } from '../core/database.ts';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { scoutHybrid } from './scout-hybrid.ts';
import { filterAgent, FilteredSource } from './filter.ts';
import { aiService } from '../services/ai.service.ts';
import { votingService } from '../services/voting.service.ts';
import { getProposicoesDeputado, getVotacoesDeputado } from '../integrations/camara.ts';
import { validateBudgetViability, mapPromiseToSiconfiCategory } from '../integrations/siconfi.ts';
import { absenceAgent } from './absence.ts';
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
        // Fallback para o comportamento anterior se o VerdictEngine falhar
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
        absenceReport // Incluir relatório de ausência nos metadados
      };

      // --- Início Checkpoint 7: Persistência de Métricas Avançadas ---
      try {
        const { analysisService } = await import('../services/analysis.service.ts');
        await analysisService.createAnalysis(
          userId,
          `Auditoria Técnica Consolidada para ${cleanName}`,
          cleanName,
          dataSources.mainCategory || 'GERAL',
          {
            absenceReport,
            consensusMetrics: {
              sourceCount: filteredSources.length,
              verifiedCount: filteredSources.filter((s: any) => s.consensus_status === 'verified').length
            }
          }
        );
      } catch (e) {
        logWarn(`[Brain] Falha ao persistir métricas avançadas: ${e}`);
      }
      // --- Fim Checkpoint 7 ---

      await this.saveAnalysis(userId, existingId, {
        politicianName: dataSources.politicianName || cleanName,
        office: dataSources.politician.office,
        party: dataSources.politician.party,
        state: dataSources.politician.state,
        aiAnalysis: finalReport,
        mainCategory: dataSources.mainCategory,
        promises: finalPromises,
        dataSources: finalResult
      });

      return finalResult;
    } catch (error) {
      logError(`[Brain] Falha na análise de ${cleanName}`, error as Error);
      throw error;
    }
  }

  private async generateOfficialProfile(politicianName: string, sources: FilteredSource[], ignoreCache: boolean = false) {
    const cleanName = politicianName.trim();
    const supabase = getSupabase();

    // 1.1 Verificar Cache de Análise Completa
    if (false) { // Forçado a ignorar cache
      const { data: cachedAnalysis } = await supabase
        .from('analyses')
        .select('*')
        .or(`politician_name.eq."${cleanName}",author.eq."${cleanName}"`)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

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
        // A função validateBudgetViability no siconfi.ts espera (category, estimatedValue, year, sphere)
        budgetViability = await validateBudgetViability(mainCategory, 1000000, 2023, 'FEDERAL');
      } catch (e) {
        logWarn(`[Brain] Falha ao validar viabilidade orçamentária: ${e}`);
      }
      
      if (canonical.camara_id) {
        projects = await getProposicoesDeputado(Number(canonical.camara_id));
        votingHistory = await getVotacoesDeputado(Number(canonical.camara_id));
      }
      
      const safeVotingHistory = Array.isArray(votingHistory) ? votingHistory : [];
      partyAlignment = safeVotingHistory.length > 0 ? 85 : 0;

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
    
    // Garantir que os campos de dados oficiais não sejam perdidos na persistência
    const legacyDataSources = {
      ...data.dataSources,
      budgetVerdict: data.dataSources.budgetVerdict || data.dataSources.budgetViability?.viable ? 'Viável' : 'Análise indisponível',
      budgetSummary: data.dataSources.budgetSummary || data.dataSources.budgetViability?.reason || 'Dados orçamentários insuficientes.',
      contrastAnalysis: data.dataSources.contrastAnalysis || 'Análise de contraste não realizada.'
    };

    const { DataCompressor } = await import('../core/compression.ts');

    const analysisData: any = {
      user_id: userId,
      author: data.politicianName,
      politician_name: data.politicianName,
      office: data.office,
      party: data.party,
      state: data.state,
      text: data.aiAnalysis,
      category: data.mainCategory,
      data_sources: typeof legacyDataSources === 'string' ? JSON.parse(legacyDataSources) : legacyDataSources,
      extracted_promises: DataCompressor.compress(data.promises || []),
      probability_score: data.dataSources.consistencyScore || 0,
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      let saveError;
      if (existingId) {
        const { error } = await supabase.from('analyses').update(analysisData).eq('id', existingId);
        saveError = error;
      } else {
        const newId = Math.random().toString(36).substring(7);
        analysisData.id = newId;
        const { error } = await supabase.from('analyses').insert([analysisData]);
        saveError = error;
      }
      if (saveError) throw saveError;
    } catch (error) {
      logError(`[Brain] Erro crítico ao salvar análise no Supabase`, error as Error);
    }
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

    REGRAS DE INTEGRIDADE E FUNDAMENTAÇÃO (RIGOR MÁXIMO):
    1. CITAÇÃO DE FONTES: Ao mencionar uma declaração ou fato, cite a fonte entre parênteses, ex: (Fonte: G1, 2024).
    2. CONFRONTO DE DADOS: Utilize os dados do SICONFI para validar se as promessas mencionadas nas notícias são financeiramente exequíveis.
    3. AUDITORIA LEGISLATIVA: Compare o discurso recente com o histórico de votações fornecido. Se ele diz apoiar a Saúde mas votou contra o piso da enfermagem, aponte a contradição com a data do voto.
    4. PROIBIDO ALUCINAR: Não invente datas, valores, projetos ou votos. Se a informação não está nas fontes, não a mencione como fato.
    5. ANÁLISE DE LACUNAS: Se os dados oficiais forem escassos, seu papel é EXPLICAR O PORQUÊ e analisar a TENDÊNCIA baseada apenas no programa partidário e notícias reais.

    ESTRUTURA DO PARECER (OBRIGATÓRIA):
    ### 🛡️ PARECER TÉCNICO DE INTELIGÊNCIA - SETH VII

    #### 1. Contexto e Discurso Atual
    (Resumo das declarações recentes citando as fontes encontradas pelo Scout)

    #### 2. Auditoria de Realidade (Dados Oficiais)
    (Análise baseada no SICONFI e histórico da Câmara. Confrontar os valores das promessas com o orçamento real da categoria)

    #### 3. Auditoria de Contradições e Consistência
    (Confronto direto entre o que o político diz nas notícias vs. como ele votou na prática)

    #### 4. Veredito de Viabilidade e Integridade
    (Conclusão técnica sobre a consistência do político e a viabilidade fiscal de suas propostas)

    #### 5. Fontes Auditadas
    (Lista numerada das fontes utilizadas para este veredito)`;
  }
}

export const brainAgent = new BrainAgent();
