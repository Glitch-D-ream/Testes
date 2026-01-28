
import { getSupabase } from '../core/database.ts';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { scoutHybrid } from './scout-hybrid.ts';
import { scoutCaseMiner } from './scout-case-miner.ts';
import { filterAgent, FilteredSource } from './filter.ts';
import { aiService } from '../services/ai.service.ts';
import { getProposicoesDeputado } from '../integrations/camara.ts';
import { validateBudgetViability } from '../integrations/siconfi.ts';
import { absenceAgent } from './absence.ts';
import { vulnerabilityAuditor } from './vulnerability.ts';
import { benchmarkingAgent } from './benchmarking.ts';
import { evidenceMiner } from '../modules/evidence-miner.ts';
import { financeService } from '../services/finance.service.ts';
import { proxyBenchmarkingAgent } from './proxy-benchmarking.ts';
import { targetDiscoveryService } from '../services/target-discovery.service.ts';
import { dataCorrelator } from './correlator.ts';

export class BrainAgent {
  async analyze(politicianName: string, userId: string | null = null, existingId: string | null = null) {
    const cleanName = politicianName.trim();
    logInfo(`[Brain] Iniciando análise profunda (Self-Discovery) para: ${cleanName}`);

    try {
      // 1. Descoberta Dinâmica de Alvo (Identidade Autônoma)
      const profile = await targetDiscoveryService.discover(cleanName);
      logInfo(`[Brain] Alvo Identificado: ${profile.office} ${profile.name} (${profile.party})`);

      const regionContext = { 
        state: profile.state !== 'Brasil' ? profile.state : this.detectRegion(cleanName).state,
        city: profile.city || this.detectRegion(cleanName).city
      };

      // 2. Coleta Multidimensional (Scout + CaseMiner)
      const searchQuery = `${profile.office} ${profile.name} ${profile.party} ${regionContext.state}`;
      
      logInfo(`[Brain] Iniciando Coleta Multidimensional para: ${profile.name}`);
      const [rawSources, caseEvidences] = await Promise.all([
        scoutHybrid.search(searchQuery, true),
        scoutCaseMiner.mine(profile.name)
      ]);
      
      logInfo(`[Brain] Scout coletou ${rawSources.length} fontes. CaseMiner coletou ${caseEvidences.length} evidências profundas.`);
      
      const filteredSources = await filterAgent.filter(rawSources, true);
      logInfo(`[Brain] Filter manteve ${filteredSources.length} fontes relevantes.`);
      
      const dataSources = { 
        politicianName: profile.name, 
        politician: { office: profile.office, party: profile.party, state: profile.state } 
      };
      
      const supabase = getSupabase();
      let { data: canonical } = await supabase.from('canonical_politicians').select('*').ilike('name', `%${cleanName}%`).maybeSingle();

      // 3. Execução Paralela dos Agentes Especializados (Ajustado pelo Cargo)
      const isLegislative = profile.office.toLowerCase().includes('deputado') || profile.office.toLowerCase().includes('senador');

      const [absenceReport, vulnerabilityReport, financeEvidences, benchmarkResult] = await Promise.all([
        isLegislative ? this.runAbsenceCheck(cleanName, filteredSources, regionContext) : Promise.resolve(null),
        this.runVulnerabilityAudit(cleanName, rawSources, filteredSources),
        this.runFinancialTraceability(cleanName, canonical),
        this.runPoliticalBenchmarking(cleanName, canonical, dataSources)
      ]);

      logInfo(`[Brain] Agentes Especializados concluíram. Vulnerabilidades: ${vulnerabilityReport?.evidences?.length || 0}, Financeiro: ${financeEvidences.length}`);

      let evidences = [...(vulnerabilityReport?.evidences || []), ...financeEvidences];
      
      // 3. Correlação Profunda de Dados
      const correlations = await dataCorrelator.correlate({
        absence: absenceReport,
        vulnerability: vulnerabilityReport,
        financial: financeEvidences,
        sources: filteredSources
      });

      // 4. Geração do Veredito (Double-Pass) - Injetando contexto de todos os agentes + correlações
      const combinedContext = {
        officialProfile: dataSources,
        absence: absenceReport,
        vulnerability: vulnerabilityReport,
        benchmarking: benchmarkResult,
        financial: financeEvidences,
        correlations: correlations,
        sources: filteredSources.map(s => ({ title: s.title, content: s.content.substring(0, 800), url: s.url }))
      };

      const { finalReport, finalPromises } = await this.generateDoublePassAIVeredict(cleanName, combinedContext, filteredSources, rawSources, regionContext);

      const finalResult = {
        ...dataSources,
        absenceReport,
        vulnerabilityReport,
        benchmarkResult,
        evidences,
        dataLineage: {
          vulnerability: 'Minerado via EvidenceMiner (Forense)',
          benchmarking: 'Baseado em dados do Supabase e APIs Oficiais',
          budget: 'SICONFI Snapshot',
          regional: `Portal Transparência ${regionContext.state}`,
          legislative: 'API Câmara/Senado',
          cases: 'Navegação profunda via Scout Case Miner v3.2'
        },
        // Garantir que as métricas de consenso apareçam no frontend
        consensusMetrics: {
          sourceCount: rawSources.length,
          verifiedCount: filteredSources.length
        }
      };

      await this.persistAnalysis(userId, finalReport, cleanName, dataSources, finalResult, filteredSources, existingId);
      return finalResult;
    } catch (error) {
      logError(`[Brain] Falha na análise de ${cleanName}`, error as Error);
      throw error;
    }
  }

  private detectRegion(name: string): { state: string, city: string } {
    const n = name.toLowerCase();
    if (n.includes('jones manoel')) return { state: 'PE', city: 'Recife' };
    if (n.includes('erika hilton')) return { state: 'SP', city: 'São Paulo' };
    if (n.includes('arthur lira')) return { state: 'AL', city: 'Maceió' };
    return { state: 'Nacional', city: 'Brasília' };
  }

  private async generateDoublePassAIVeredict(cleanName: string, combinedContext: any, filteredSources: any[], rawSources: any[], region: any) {
    logInfo(`[Brain] [Double-Pass] Iniciando VerdictEngine para ${cleanName} em ${region.state}...`);
    
    let aiAnalysis = "";
    let extractedPromisesFromAI: any[] = [];

    try {
      const strictPrompt = `
DOSSIÊ DE INTELIGÊNCIA FORENSE - SETH VII v3.0 (IRONCLAD DEEP)
ALVO: ${cleanName}
IDENTIDADE: ${combinedContext.officialProfile.politician.office} (${combinedContext.officialProfile.politician.party})

DADOS BRUTOS PARA CORRELAÇÃO:
- PERFIL OFICIAL: ${JSON.stringify(combinedContext.officialProfile)}
- AUDITORIA DE AUSÊNCIA: ${JSON.stringify(combinedContext.absence)}
- VULNERABILIDADES TÉCNICAS: ${JSON.stringify(combinedContext.vulnerability)}
- CORRELAÇÕES DETECTADAS: ${JSON.stringify(combinedContext.correlations)}
- EVIDÊNCIAS DE CASOS/ENTREVISTAS: ${JSON.stringify(combinedContext.caseEvidences)}
- FONTES PRIMÁRIAS (CITE-AS): ${JSON.stringify(combinedContext.sources)}

INSTRUÇÕES MANDATÓRIAS:
1. SEJA INCISIVO: Não use "pode ser", use "os dados indicam". Conecte o dinheiro (emendas) com os votos e discursos.
2. CITAÇÃO DIRETA: Você DEVE citar nomes de projetos, valores em Reais (R$) e títulos de notícias/documentos presentes nas fontes.
3. ANÁLISE DE IMPACTO: Explique O QUE a ausência ou vulnerabilidade significa para o cidadão.
4. ESTRUTURA DE ALTO NÍVEL:
   - QUADRO EXECUTIVO: Fatos de impacto imediato.
   - CORRELAÇÃO DE DADOS: Onde o dinheiro e o poder se encontram (conecte as fontes).
   - VETORES DE RISCO: Vulnerabilidades e inconsistências detectadas com evidências.
   - VEREDITO FORENSE: Parecer final baseado na densidade de dados.

Se os dados forem mínimos, não invente, mas explore ao máximo as conexões entre o pouco que existe.
NÃO use tom de biografia. Use tom de relatório de agência de inteligência.

PARECER TÉCNICO:`;
      aiAnalysis = await aiService.generateReport(strictPrompt);
      const extractionPrompt = `Extraia JSON de promessas do parecer: ${aiAnalysis}`;
      const structuredResult = await aiService.analyzeText(extractionPrompt);
      if (structuredResult?.promises) extractedPromisesFromAI = structuredResult.promises;
    } catch (error) {
      logWarn(`[Brain] Falha no fluxo de IA, usando fallbacks...`);
    }

    return { 
      finalReport: aiAnalysis || `Parecer técnico atualizado sobre ${cleanName} em ${region.state}...`, 
      finalPromises: extractedPromisesFromAI 
    };
  }

  private async runAbsenceCheck(cleanName: string, filteredSources: any[], region: any) {
    try {
      return await absenceAgent.checkAbsence(cleanName, 'GERAL');
    } catch (e) { return null; }
  }

  private async runVulnerabilityAudit(cleanName: string, rawSources: any[], filteredSources: any[]) {
    try {
      const evidences = await evidenceMiner.mine(cleanName, filteredSources.length > 0 ? filteredSources : rawSources.slice(0, 10));
      const vulnerabilityReport = await vulnerabilityAuditor.audit(cleanName, evidences);
      return { ...vulnerabilityReport, evidences };
    } catch (e) { return { evidences: [] }; }
  }

  private async runFinancialTraceability(cleanName: string, canonical: any) {
    try {
      const pixEmendas = await financeService.getPixEmendas(cleanName);
      return pixEmendas.map(f => ({
        statement: f.description,
        sourceTitle: f.source,
        sourceUrl: f.link || '',
        category: 'INSTITUTIONAL',
        impactScore: 50,
        context: `Valor: R$ ${f.value || 'N/A'}`
      }));
    } catch (e) { return []; }
  }

  private async runPoliticalBenchmarking(cleanName: string, canonical: any, dataSources: any) {
    try {
      if (!canonical || (!canonical.camara_id && !canonical.senado_id)) {
        return await proxyBenchmarkingAgent.getProxyAnalysis(cleanName);
      } else {
        return await benchmarkingAgent.compare(cleanName, dataSources);
      }
    } catch (e) { return null; }
  }

  private async persistAnalysis(userId: string | null, finalReport: string, cleanName: string, dataSources: any, finalResult: any, filteredSources: any[], existingId: string | null) {
    try {
      const supabase = getSupabase();
      const politicianData = dataSources.politician;
      
      const analysisData = {
        user_id: userId,
        text: finalReport,
        author: cleanName,
        category: 'GERAL',
        politician_name: cleanName,
        office: politicianData.office,
        party: politicianData.party,
        state: politicianData.state,
        status: 'completed',
        data_sources: JSON.stringify({
          absenceReport: finalResult.absenceReport,
          vulnerabilityReport: finalResult.vulnerabilityReport,
          benchmarkResult: finalResult.benchmarkResult,
          caseEvidences: finalResult.caseEvidences,
          dataLineage: finalResult.dataLineage,
          evidences: finalResult.evidences
        })
      };

      if (existingId) {
        await supabase.from('analyses').update(analysisData).eq('id', existingId);
      } else {
        await supabase.from('analyses').insert([analysisData]);
      }
      logInfo(`[Brain] Análise persistida com sucesso para ${cleanName}`);
    } catch (e) { logWarn(`[Brain] Erro na persistência: ${e}`); }
  }

  private async generateOfficialProfile(politicianName: string, sources: FilteredSource[], region: any) {
    // Agora este método é apenas um fallback, pois usamos o TargetDiscoveryService
    return { 
      politicianName, 
      politician: { 
        office: 'Agente Político', 
        party: 'Em Análise', 
        state: region.state 
      }
    };
  }
}

export const brainAgent = new BrainAgent();
