
import { getSupabase } from '../core/database.ts';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { scoutHybrid } from './scout-hybrid.ts';
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

export class BrainAgent {
  async analyze(politicianName: string, userId: string | null = null, existingId: string | null = null) {
    const cleanName = politicianName.trim();
    logInfo(`[Brain] Iniciando análise profunda (Regional-Aware) para: ${cleanName}`);

    try {
      const regionContext = this.detectRegion(cleanName);
      logInfo(`[Brain] Contexto regional detectado: ${regionContext.state} (${regionContext.city})`);

      // 1. Coleta e Filtragem (Garantir que fontes brutas não sumam)
      const rawSources = await scoutHybrid.search(`${cleanName} ${regionContext.state}`, true);
      logInfo(`[Brain] Scout coletou ${rawSources.length} fontes brutas.`);
      
      const filteredSources = await filterAgent.filter(rawSources, true);
      logInfo(`[Brain] Filter manteve ${filteredSources.length} fontes relevantes.`);
      
      const dataSources = await this.generateOfficialProfile(cleanName, filteredSources, regionContext);
      const supabase = getSupabase();
      let { data: canonical } = await supabase.from('canonical_politicians').select('*').ilike('name', `%${cleanName}%`).maybeSingle();

      // 2. Execução Paralela dos Agentes Especializados
      const [absenceReport, vulnerabilityReport, financeEvidences, benchmarkResult] = await Promise.all([
        this.runAbsenceCheck(cleanName, filteredSources, regionContext),
        this.runVulnerabilityAudit(cleanName, rawSources, filteredSources),
        this.runFinancialTraceability(cleanName, canonical),
        this.runPoliticalBenchmarking(cleanName, canonical, dataSources)
      ]);

      logInfo(`[Brain] Agentes Especializados concluíram. Vulnerabilidades: ${vulnerabilityReport?.evidences?.length || 0}, Financeiro: ${financeEvidences.length}`);

      let evidences = [...(vulnerabilityReport?.evidences || []), ...financeEvidences];
      
      // 3. Geração do Veredito (Double-Pass) - Injetando contexto de todos os agentes
      const combinedContext = {
        officialProfile: dataSources,
        absence: absenceReport,
        vulnerability: vulnerabilityReport,
        benchmarking: benchmarkResult,
        financial: financeEvidences,
        sources: filteredSources.map(s => ({ title: s.title, content: s.content.substring(0, 500) }))
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
          legislative: 'API Câmara/Senado'
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
AUDITORIA FORENSE POLÍTICA - SETH VII v2.6
ALVO: ${cleanName}
CONTEXTO REGIONAL: ${region.state} / ${region.city}

DADOS TÉCNICOS DOS AGENTES:
- Perfil: ${JSON.stringify(combinedContext.officialProfile)}
- Relatório de Ausência: ${JSON.stringify(combinedContext.absence)}
- Vulnerabilidades: ${JSON.stringify(combinedContext.vulnerability)}
- Benchmarking: ${JSON.stringify(combinedContext.benchmarking)}
- Fontes Relevantes: ${JSON.stringify(combinedContext.sources)}

INSTRUÇÕES PARA O PARECER:
1. INTEGRAÇÃO TOTAL: Você DEVE usar os dados dos agentes acima. Se houver vulnerabilidades ou ausências, cite-as.
2. FOCO EM FATOS: Analise apenas o que está nos dados. Não invente trajetórias.
3. TOM CLÍNICO: Use linguagem técnica e fria.
4. ESTRUTURA OBRIGATÓRIA:
   - Resumo Executivo (Fatos principais)
   - Análise de Coerência (Discurso vs Atos Oficiais)
   - Pontos de Atenção (Vulnerabilidades e Ausências detectadas)
   - Conclusão Técnica (Veredito final)

Se os dados forem insuficientes, declare: "DADOS INSUFICIENTES PARA AUDITORIA COMPLETA".
NÃO invente biografia. Use apenas o que os agentes coletaram.

PARECER:`;
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
    const name = politicianName.toLowerCase();
    
    // Power Target Resolver: Mapeamento de Políticos Notórios
    if (name.includes('lula') || name.includes('luiz inácio')) {
      return {
        politicianName: 'Luiz Inácio Lula da Silva',
        politician: { office: 'Presidente da República', party: 'PT', state: 'Brasil' }
      };
    }
    if (name.includes('bolsonaro') || name.includes('jair')) {
      return {
        politicianName: 'Jair Messias Bolsonaro',
        politician: { office: 'Ex-Presidente / Político', party: 'PL', state: 'Brasil' }
      };
    }
    if (name.includes('tarcisio') || name.includes('tarcísio')) {
      return {
        politicianName: 'Tarcísio de Freitas',
        politician: { office: 'Governador', party: 'Republicanos', state: 'SP' }
      };
    }
    if (name.includes('haddad')) {
      return {
        politicianName: 'Fernando Haddad',
        politician: { office: 'Ministro da Fazenda', party: 'PT', state: 'Brasil' }
      };
    }

    // Fallback: Tentar extrair do contexto das fontes se não for um Power Target
    const hasCongressContext = sources.some(s => s.content.toLowerCase().includes('deputado') || s.content.toLowerCase().includes('câmara'));
    
    return { 
      politicianName, 
      politician: { 
        office: hasCongressContext ? 'Deputado Federal' : 'Agente Político', 
        party: 'Em Análise', 
        state: region.state 
      }
    };
  }
}

export const brainAgent = new BrainAgent();
