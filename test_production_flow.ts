/**
 * TESTE REALISTA DO FLUXO DE PRODUÇÃO - SETH VII
 * 
 * Este teste simula o que acontece em produção:
 * 1. Busca dados REAIS das APIs oficiais (Câmara, Portal Transparência)
 * 2. Envia para a IA (Groq) com o prompt completo do sistema
 * 3. Gera o relatório final com cruzamentos
 */

import * as dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';

// Chaves de API
const GROQ_API_KEY = process.env.GROQ_API_KEY;

interface DeputadoData {
  id: number;
  nome: string;
  siglaPartido: string;
  siglaUf: string;
  urlFoto: string;
}

interface Despesa {
  tipoDespesa: string;
  valorLiquido: number;
  dataDocumento: string;
  nomeFornecedor: string;
}

interface Proposicao {
  siglaTipo: string;
  numero: number;
  ano: number;
  ementa: string;
}

async function testProductionFlow() {
  console.log(`\n${BOLD}${CYAN}╔════════════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║     TESTE DE FLUXO DE PRODUÇÃO - SETH VII                          ║${RESET}`);
  console.log(`${BOLD}${CYAN}║     Simulação Real com APIs Oficiais + IA                          ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚════════════════════════════════════════════════════════════════════╝${RESET}\n`);

  const targetName = 'Arthur Lira';
  const collectedData: any = {
    profile: null,
    despesas: [],
    proposicoes: [],
    votacoes: [],
    news: []
  };

  // ═══════════════════════════════════════════════════════════════
  // FASE 1: COLETA DE DADOS OFICIAIS (APIs Reais)
  // ═══════════════════════════════════════════════════════════════
  
  console.log(`${BOLD}[FASE 1] COLETA DE DADOS OFICIAIS${RESET}`);
  console.log('─'.repeat(70));

  // 1.1 Buscar deputado na API da Câmara
  console.log(`\n${CYAN}[1.1] API da Câmara dos Deputados${RESET}`);
  try {
    const searchResp = await axios.get('https://dadosabertos.camara.leg.br/api/v2/deputados', {
      params: { nome: targetName, ordem: 'ASC', ordenarPor: 'nome' },
      timeout: 10000
    });
    
    const deputados = searchResp.data.dados || [];
    if (deputados.length > 0) {
      const dep = deputados[0];
      collectedData.profile = {
        id: dep.id,
        nome: dep.nome,
        partido: dep.siglaPartido,
        uf: dep.siglaUf,
        foto: dep.urlFoto
      };
      console.log(`${GREEN}✓ Deputado encontrado: ${dep.nome} (${dep.siglaPartido}/${dep.siglaUf})${RESET}`);
      console.log(`  ID: ${dep.id}`);

      // 1.2 Buscar despesas (Cota Parlamentar)
      console.log(`\n${CYAN}[1.2] Despesas da Cota Parlamentar${RESET}`);
      try {
        const despResp = await axios.get(`https://dadosabertos.camara.leg.br/api/v2/deputados/${dep.id}/despesas`, {
          params: { ano: 2024, itens: 15, ordem: 'DESC', ordenarPor: 'dataDocumento' },
          timeout: 10000
        });
        collectedData.despesas = despResp.data.dados || [];
        console.log(`${GREEN}✓ ${collectedData.despesas.length} despesas encontradas${RESET}`);
        
        // Mostrar top 5
        collectedData.despesas.slice(0, 5).forEach((d: any, i: number) => {
          console.log(`  ${i+1}. ${d.tipoDespesa}: R$ ${d.valorLiquido?.toFixed(2)} - ${d.nomeFornecedor?.substring(0, 30)}`);
        });
      } catch (e: any) {
        console.log(`${YELLOW}⚠ Erro ao buscar despesas: ${e.message}${RESET}`);
      }

      // 1.3 Buscar proposições (Projetos de Lei)
      console.log(`\n${CYAN}[1.3] Proposições (Projetos de Lei)${RESET}`);
      try {
        const propResp = await axios.get('https://dadosabertos.camara.leg.br/api/v2/proposicoes', {
          params: { idDeputadoAutor: dep.id, ordem: 'DESC', ordenarPor: 'id', itens: 10 },
          timeout: 10000
        });
        collectedData.proposicoes = propResp.data.dados || [];
        console.log(`${GREEN}✓ ${collectedData.proposicoes.length} proposições encontradas${RESET}`);
        
        collectedData.proposicoes.slice(0, 3).forEach((p: any, i: number) => {
          console.log(`  ${i+1}. ${p.siglaTipo} ${p.numero}/${p.ano}: ${p.ementa?.substring(0, 60)}...`);
        });
      } catch (e: any) {
        console.log(`${YELLOW}⚠ Erro ao buscar proposições: ${e.message}${RESET}`);
      }

    } else {
      console.log(`${RED}✗ Deputado não encontrado${RESET}`);
    }
  } catch (e: any) {
    console.log(`${RED}✗ Erro na API da Câmara: ${e.message}${RESET}`);
  }

  // 1.4 Buscar notícias recentes (Google News RSS)
  console.log(`\n${CYAN}[1.4] Notícias Recentes (Google News)${RESET}`);
  try {
    const newsResp = await axios.get(`https://news.google.com/rss/search`, {
      params: { q: `${targetName} política`, hl: 'pt-BR', gl: 'BR', ceid: 'BR:pt-419' },
      timeout: 10000
    });
    
    // Parse RSS simples
    const rssText = newsResp.data;
    const titleMatches = rssText.match(/<title>([^<]+)<\/title>/g) || [];
    collectedData.news = titleMatches.slice(1, 6).map((t: string) => t.replace(/<\/?title>/g, ''));
    
    console.log(`${GREEN}✓ ${collectedData.news.length} notícias encontradas${RESET}`);
    collectedData.news.forEach((n: string, i: number) => {
      console.log(`  ${i+1}. ${n.substring(0, 70)}...`);
    });
  } catch (e: any) {
    console.log(`${YELLOW}⚠ Erro ao buscar notícias: ${e.message}${RESET}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // FASE 2: ANÁLISE VIA IA (Groq - Llama 3.3)
  // ═══════════════════════════════════════════════════════════════
  
  console.log(`\n\n${BOLD}[FASE 2] ANÁLISE VIA IA (Groq - Llama 3.3 70B)${RESET}`);
  console.log('─'.repeat(70));

  if (!GROQ_API_KEY) {
    console.log(`${RED}✗ GROQ_API_KEY não configurada${RESET}`);
    return;
  }

  // Montar prompt completo do Seth VII
  const fullPrompt = `
VOCÊ É O NÚCLEO DE INTELIGÊNCIA FORENSE DA SETH VII - PLATAFORMA DE ANÁLISE DE PROMESSAS POLÍTICAS.

ALVO DA ANÁLISE: ${collectedData.profile?.nome || targetName}
CARGO: Deputado Federal
PARTIDO: ${collectedData.profile?.partido || 'N/A'}
ESTADO: ${collectedData.profile?.uf || 'N/A'}

═══════════════════════════════════════════════════════════════════════
DADOS COLETADOS DAS APIS OFICIAIS (FONTES PRIMÁRIAS):
═══════════════════════════════════════════════════════════════════════

📊 DESPESAS DA COTA PARLAMENTAR (2024):
${collectedData.despesas.slice(0, 10).map((d: any) => 
  `- ${d.tipoDespesa}: R$ ${d.valorLiquido?.toFixed(2)} | ${d.nomeFornecedor} | ${d.dataDocumento}`
).join('\n') || 'Dados indisponíveis'}

Total de despesas analisadas: ${collectedData.despesas.length}
Valor total: R$ ${collectedData.despesas.reduce((acc: number, d: any) => acc + (d.valorLiquido || 0), 0).toFixed(2)}

📜 PROPOSIÇÕES (PROJETOS DE LEI):
${collectedData.proposicoes.slice(0, 5).map((p: any) => 
  `- ${p.siglaTipo} ${p.numero}/${p.ano}: ${p.ementa}`
).join('\n') || 'Dados indisponíveis'}

📰 NOTÍCIAS RECENTES:
${collectedData.news.map((n: string, i: number) => `${i+1}. ${n}`).join('\n') || 'Dados indisponíveis'}

═══════════════════════════════════════════════════════════════════════
INSTRUÇÕES DE ANÁLISE (MODO ADVERSARIAL):
═══════════════════════════════════════════════════════════════════════

1. SEJA INCISIVO: Não aceite declarações pelo valor nominal. Procure contradições.
2. CRUZAMENTO DE DADOS: Compare as despesas com os projetos de lei. O dinheiro gasto condiz com as prioridades declaradas?
3. ANÁLISE DE PADRÕES: Identifique padrões suspeitos nas despesas (valores repetidos, fornecedores frequentes).
4. CONTRADIÇÕES: Compare o discurso público (notícias) com as ações concretas (proposições, gastos).
5. CITAÇÃO DIRETA: Use os dados fornecidos. NÃO invente informações.

═══════════════════════════════════════════════════════════════════════
FORMATO DE RESPOSTA (JSON ESTRUTURADO):
═══════════════════════════════════════════════════════════════════════

{
  "politician": {
    "name": "Nome completo",
    "office": "Cargo",
    "party": "Partido",
    "state": "Estado"
  },
  "financialAnalysis": {
    "totalExpenses": 0,
    "topCategories": [{"category": "tipo", "total": 0, "percentage": 0}],
    "redFlags": ["padrão suspeito identificado"],
    "frequentSuppliers": [{"name": "fornecedor", "total": 0, "count": 0}]
  },
  "legislativeAnalysis": {
    "totalPropositions": 0,
    "mainThemes": ["tema"],
    "coherenceWithExpenses": "análise de coerência entre gastos e projetos"
  },
  "contradictions": [
    {
      "topic": "tema",
      "publicDiscourse": "o que disse publicamente",
      "actualAction": "o que fez de fato",
      "evidence": "fonte/dado que comprova"
    }
  ],
  "credibilityScore": 0,
  "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
  "verdict": {
    "summary": "resumo executivo em 2-3 frases",
    "facts": ["fato comprovado 1", "fato comprovado 2"],
    "concerns": ["preocupação 1", "preocupação 2"],
    "recommendation": "recomendação para o cidadão"
  }
}

RESPONDA APENAS O JSON, SEM EXPLICAÇÕES ADICIONAIS.`;

  try {
    console.log(`\nEnviando para Groq (Llama 3.3 70B)...`);
    const startTime = Date.now();
    
    const aiResp = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Você é um auditor forense político. Responda apenas JSON válido.' },
        { role: 'user', content: fullPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    const elapsed = Date.now() - startTime;
    const content = aiResp.data.choices[0].message.content;
    
    console.log(`${GREEN}✓ Análise concluída em ${(elapsed/1000).toFixed(2)}s${RESET}`);
    
    // ═══════════════════════════════════════════════════════════════
    // FASE 3: EXIBIÇÃO DO RELATÓRIO FINAL
    // ═══════════════════════════════════════════════════════════════
    
    console.log(`\n\n${BOLD}${GREEN}╔════════════════════════════════════════════════════════════════════╗${RESET}`);
    console.log(`${BOLD}${GREEN}║              RELATÓRIO FINAL - SETH VII                             ║${RESET}`);
    console.log(`${BOLD}${GREEN}╚════════════════════════════════════════════════════════════════════╝${RESET}\n`);
    
    // Tentar parsear JSON
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        
        console.log(`${BOLD}${CYAN}[PERFIL]${RESET}`);
        console.log(`Nome: ${analysis.politician?.name}`);
        console.log(`Cargo: ${analysis.politician?.office}`);
        console.log(`Partido: ${analysis.politician?.party}/${analysis.politician?.state}`);
        
        console.log(`\n${BOLD}${CYAN}[MÉTRICAS]${RESET}`);
        console.log(`🎯 Credibilidade: ${analysis.credibilityScore}%`);
        console.log(`⚠️ Nível de Risco: ${analysis.riskLevel}`);
        
        console.log(`\n${BOLD}${CYAN}[ANÁLISE FINANCEIRA]${RESET}`);
        console.log(`Total de Despesas: R$ ${analysis.financialAnalysis?.totalExpenses?.toLocaleString('pt-BR')}`);
        if (analysis.financialAnalysis?.topCategories) {
          console.log(`Principais Categorias:`);
          analysis.financialAnalysis.topCategories.forEach((c: any, i: number) => {
            console.log(`  ${i+1}. ${c.category}: R$ ${c.total?.toLocaleString('pt-BR')} (${c.percentage}%)`);
          });
        }
        if (analysis.financialAnalysis?.redFlags?.length > 0) {
          console.log(`\n${RED}🚩 Red Flags:${RESET}`);
          analysis.financialAnalysis.redFlags.forEach((f: string) => console.log(`  - ${f}`));
        }
        
        console.log(`\n${BOLD}${CYAN}[ANÁLISE LEGISLATIVA]${RESET}`);
        console.log(`Total de Proposições: ${analysis.legislativeAnalysis?.totalPropositions}`);
        console.log(`Coerência com Gastos: ${analysis.legislativeAnalysis?.coherenceWithExpenses}`);
        
        if (analysis.contradictions?.length > 0) {
          console.log(`\n${BOLD}${CYAN}[CONTRADIÇÕES IDENTIFICADAS]${RESET}`);
          analysis.contradictions.forEach((c: any, i: number) => {
            console.log(`\n${i+1}. ${c.topic}:`);
            console.log(`   Discurso: ${c.publicDiscourse}`);
            console.log(`   Ação Real: ${c.actualAction}`);
            console.log(`   Evidência: ${c.evidence}`);
          });
        }
        
        console.log(`\n${BOLD}${CYAN}[VEREDITO]${RESET}`);
        console.log(`\n📋 Resumo: ${analysis.verdict?.summary}`);
        console.log(`\n✓ Fatos Comprovados:`);
        analysis.verdict?.facts?.forEach((f: string) => console.log(`  - ${f}`));
        console.log(`\n⚠️ Preocupações:`);
        analysis.verdict?.concerns?.forEach((c: string) => console.log(`  - ${c}`));
        console.log(`\n💡 Recomendação: ${analysis.verdict?.recommendation}`);
        
      } else {
        console.log(`Resposta da IA (texto):\n${content}`);
      }
    } catch (parseErr) {
      console.log(`Resposta da IA (não parseável como JSON):\n${content}`);
    }
    
  } catch (e: any) {
    console.log(`${RED}✗ Erro na análise via IA: ${e.message}${RESET}`);
    if (e.response?.data) {
      console.log(`Detalhes: ${JSON.stringify(e.response.data)}`);
    }
  }

  console.log(`\n${'─'.repeat(70)}`);
  console.log(`${BOLD}Teste de fluxo de produção concluído.${RESET}\n`);
}

testProductionFlow().catch(console.error);
