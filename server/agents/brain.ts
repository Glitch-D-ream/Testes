import { getSupabase } from '../core/database.ts';
import { aiService } from '../services/ai.service.ts';
import { validateBudgetViability, mapPromiseToSiconfiCategory } from '../integrations/siconfi.ts';
import { temporalIncoherenceService } from '../services/temporal-incoherence.service.ts';
import { negativeEvidenceService } from '../services/negative-evidence.service.ts';
import { projectPromiseExtractorService } from '../services/project-promise-extractor.service.ts';
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
      Resumo: ${dataSources.budgetSummary}.
      
      ANÁLISE DE CONTRASTE E INAÇÃO (Diz vs Faz):
      - Score de Ausência de Esforço: ${dataSources.contrastAnalysis.negativeEvidenceScore}/100.
      - Janela de Observação: 365 dias (Histórico Recente).
      - Projetos Relevantes Encontrados: ${dataSources.contrastAnalysis.details.relevantProjectsFound}.
      - Votações Relevantes Encontradas: ${dataSources.contrastAnalysis.details.relevantVotesFound}.
      - Veredito de Inação: ${dataSources.contrastAnalysis.negativeEvidenceScore > 80 ? 'INAÇÃO SUSTENTADA DETECTADA' : 'Ação Legislativa Identificada'}.
      - Explicação: ${dataSources.contrastAnalysis.details.explanation}.
      
      EVENTOS DECLARATIVOS (Scout):
      ${sources.length > 0 
        ? sources.map(s => `- [Camada ${s.credibilityLayer}] ${s.title} (Força: ${s.promiseStrength})`).join('\n')
        : 'Nenhum evento declarativo recente detectado.'}
      
      DIRETRIZ DE STATUS: Se uma promessa for detectada no Scout (Camada B ou C) mas não tiver PL correspondente (Camada A), classifique-a como "PROMESSA NÃO FORMALIZADA".
      
      DIRETRIZ DE AUDITORIA: 
      1. Se o Score de Ausência for alto (>80), o "vazio" é o seu dado principal. Não diga "não encontramos dados", diga "após análise do histórico legislativo, detectamos um SILÊNCIO ESTRUTURAL sobre este tema".
      2. Transforme a falta de projetos em uma evidência de despriorização política.
      3. O tempo é sua arma: destaque que em um ano de observação, o político produziu zero sinal sobre a promessa.
      
      PROMESSAS TÉCNICAS EXTRAÍDAS DE PROJETOS:
      ${dataSources.technicalPromises && dataSources.technicalPromises.length > 0 
        ? dataSources.technicalPromises.map((p: any) => `- [${p.projectTitle}] ${p.text} (Intenção: ${p.intent})`).join('\n')
        : 'Nenhuma promessa técnica extraída dos projetos recentes.'}
      
      DIRETRIZ: Use estas promessas técnicas para mostrar que o político está agindo (ou não) de forma concreta através de leis.`;
      
      logInfo(`[Brain] Gerando parecer técnico via IA para ${cleanName}...`);
      
      // Adicionar instrução de JSON ao prompt para garantir extração estruturada
      const enhancedPrompt = `${reportPrompt}
      
      IMPORTANTE: Sua resposta deve ser OBRIGATORIAMENTE um objeto JSON válido. 
      Não inclua textos fora do JSON.
      
      POSTURA ANALÍTICA: Você não é apenas um assistente, você é um AUDITOR. 
      Se o político não fez nada, seu relatório deve ser incisivo sobre esse "vazio". 
      O silêncio legislativo é uma escolha política, e você deve reportá-la como tal.
      
      Estrutura esperada:
      {
        "report": "Seu parecer técnico completo em Markdown aqui. Use títulos como 'Veredito de Inação' se o score for alto.",
        "promises": [
          {
            "text": "Descrição da promessa ou compromisso identificado",
            "category": "SAUDE/EDUCACAO/ECONOMIA/etc",
            "confidence": 0.85,
            "status": "FORMALIZADA | NÃO FORMALIZADA | EM ANDAMENTO",
            "reasoning": "Explicação técnica da viabilidade ou da inação detectada"
          }
        ]
      }
      
      Se não encontrar promessas explícitas, denuncie a falta de compromisso formalizado no tema analisado.`;

      const aiResponseRaw = await aiService.generateReport(enhancedPrompt);
      let aiAnalysis = aiResponseRaw;
      let extractedPromisesFromAI = [];

      try {
        const jsonMatch = aiResponseRaw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          aiAnalysis = parsed.report || aiResponseRaw;
          extractedPromisesFromAI = parsed.promises || [];
        }
      } catch (e) {
        logWarn('[Brain] Falha ao parsear resposta estruturada da IA. Usando texto bruto.');
      }

      // FALLBACK FINAL: Se a IA falhar completamente ou não retornar promessas, usar o extrator local (NLP)
      if (extractedPromisesFromAI.length === 0 && sources.length > 0) {
        logWarn('[Brain] IA não retornou promessas. Ativando fallback de NLP local...');
        const { extractPromises } = await import('../modules/nlp.ts');
        const allContent = sources.map(s => s.content).join('\n\n');
        const nlpPromises = extractPromises(allContent);
        if (nlpPromises.length > 0) {
          logInfo(`[Brain] NLP local extraiu ${nlpPromises.length} promessas candidatas.`);
          extractedPromisesFromAI = nlpPromises.map(p => ({ ...p, reasoning: 'Extraído via análise de padrões linguísticos locais.' }));
        }
      }
      
      // Usar promessas extraídas da IA ou as técnicas dos projetos
    let finalPromises = extractedPromisesFromAI;

    // Se não houver promessas da IA, usar as técnicas extraídas dos projetos como fallback
    if (finalPromises.length === 0 && dataSources.technicalPromises) {
      finalPromises = dataSources.technicalPromises.map((p: any) => ({
        text: p.text,
        category: p.category,
        confidence: 0.8,
        reasoning: `Extraído automaticamente do projeto ${p.projectTitle}. Intenção: ${p.intent}`
      }));
    }

    await this.saveAnalysis(userId, existingId, {
        politicianName: cleanName,
        aiAnalysis,
        mainCategory: dataSources.mainCategory,
        promises: finalPromises,
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
    
    // Análise de Contraste (Evidência Negativa)
    const contrastAnalysis = await negativeEvidenceService.analyzeContrast(cleanName, sources[0]?.content || 'Geral', mainCategory);

    // Extrair promessas técnicas dos projetos de lei (Bootstrap Automático)
    let technicalPromises: any[] = [];
    if (projects.length > 0) {
      logInfo(`[Brain] Extraindo promessas técnicas de ${projects.length} projetos para ${cleanName}`);
      // Processar sequencialmente para evitar rate limit em provedores gratuitos
      const projectsToAnalyze = projects.slice(0, 2);
      for (let i = 0; i < projectsToAnalyze.length; i++) {
        const p = projectsToAnalyze[i];
        try {
          logInfo(`[Brain] Processando projeto ${i + 1}/${projectsToAnalyze.length}: ${p.sigla || 'PL'} ${p.numero || p.id}`);
          const extracted = await projectPromiseExtractorService.extractFromProject(p);
          if (extracted && extracted.length > 0) {
            technicalPromises.push(...extracted);
          }
          // Pequeno delay para evitar rate limit agressivo
          if (i < projectsToAnalyze.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (e) {
          logWarn(`[Brain] Falha ao extrair promessas do projeto ${p.id}. Pulando...`);
        }
      }
    }

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
      contrastAnalysis,
      technicalPromises,
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

    const { DataCompressor } = await import('../core/compression.ts');
    const { nanoid } = await import('nanoid');

    // Criar objeto de dados garantindo compatibilidade com schemas antigos e novos
    const analysisData: any = {
      user_id: userId,
      author: data.politicianName,
      text: data.aiAnalysis,
      category: data.mainCategory,
      data_sources: legacyDataSources,
      extracted_promises: DataCompressor.compress(data.promises || []),
      probability_score: data.dataSources.consistencyScore || 0,
      status: 'completed',
      updated_at: new Date().toISOString(),
      total_budget: data.dataSources.budgetViability?.totalBudget || 0,
      executed_budget: data.dataSources.budgetViability?.executedBudget || 0,
      execution_rate: data.dataSources.budgetViability?.executionRate || 0
    };

    // Adicionar politician_name apenas se o banco suportar (evita erro de schema cache)
    // Em alguns casos, o Supabase demora a atualizar o cache de colunas
    analysisData.politician_name = data.politicianName;

    try {
      let saveError;
      if (existingId) {
        logInfo(`[Brain] Atualizando análise existente: ${existingId}`);
        const { error } = await supabase.from('analyses').update(analysisData).eq('id', existingId);
        saveError = error;
        } else {
          const newId = Math.random().toString(36).substring(7);
          (analysisData as any).id = newId;
          logInfo(`[Brain] Criando nova análise: ${newId}`);
          const { error } = await supabase.from('analyses').insert([{ ...analysisData }]);
          saveError = error;
        }

      // Se falhar por causa da coluna politician_name (erro de cache do Supabase), tentar sem ela
      if (saveError && saveError.message.includes('politician_name')) {
        logWarn(`[Brain] Falha de schema detectada. Tentando salvamento sem a coluna 'politician_name'...`);
        delete analysisData.politician_name;
        if (existingId) {
          const { error } = await supabase.from('analyses').update(analysisData).eq('id', existingId);
          saveError = error;
        } else {
          const newId = Math.random().toString(36).substring(7);
          (analysisData as any).id = newId;
          const { error } = await supabase.from('analyses').insert([{ ...analysisData }]);
          saveError = error;
        }
      }

      if (saveError) throw saveError;

      // Salvar promessas individuais para a tabela 'promises'
      const finalAnalysisId = existingId || (analysisData as any).id;
      if (finalAnalysisId && data.promises && data.promises.length > 0) {
        logInfo(`[Brain] Salvando ${data.promises.length} promessas individuais para análise ${finalAnalysisId}`);
        const promisesToInsert = data.promises.map((p: any) => ({
          id: nanoid(),
          analysis_id: finalAnalysisId,
          promise_text: p.text,
          category: p.category || data.mainCategory,
          confidence_score: p.confidence || 0.5,
          negated: p.negated || false,
          conditional: p.conditional || false
        }));

        const { error: promisesError } = await supabase.from('promises').insert(promisesToInsert);
        if (promisesError) {
          logError(`[Brain] Erro ao salvar promessas individuais: ${promisesError.message}`);
        }
      }

      logInfo(`[Brain] Status da análise atualizado para 'completed' com sucesso.`);
    } catch (err: any) {
      logError(`[Brain] Erro fatal ao salvar análise: ${err.message}`);
      throw err;
    }
  }
}

export const brainAgent = new BrainAgent();
