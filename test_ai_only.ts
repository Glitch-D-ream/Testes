/**
 * TESTE FOCADO NA IA - Seth VII
 * Testa apenas o fluxo de IA sem depender de coleta de fontes
 */

import * as dotenv from 'dotenv';
dotenv.config();

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';

async function testAI() {
  console.log(`\n${BOLD}${CYAN}╔════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║          TESTE DE IA - SETH VII - ANÁLISE LULA              ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚════════════════════════════════════════════════════════════╝${RESET}\n`);

  // Verificar chaves
  console.log(`${BOLD}[0] VERIFICANDO CHAVES DE API${RESET}`);
  console.log('─'.repeat(50));
  console.log(`GROQ_API_KEY: ${process.env.GROQ_API_KEY ? '✓ Configurada' : '✗ Não configurada'}`);
  console.log(`OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? '✓ Configurada' : '✗ Não configurada'}`);

  // Texto de exemplo para análise (simulando fontes coletadas)
  const sampleText = `
FONTES COLETADAS SOBRE LULA:

1. Folha de S.Paulo (15/01/2024): "Lula promete criar 2 milhões de empregos em 2024"
   O presidente Lula anunciou meta ambiciosa de geração de empregos para o ano.
   
2. G1 (20/01/2024): "Governo Lula aumenta salário mínimo para R$ 1.412"
   O reajuste representa aumento real de 2,5% acima da inflação.
   
3. Estadão (10/01/2024): "Bolsa Família atinge 21 milhões de famílias"
   Programa social foi ampliado conforme prometido na campanha.
   
4. UOL (05/01/2024): "Inflação fecha 2023 em 4,62%, dentro da meta"
   Economia mostra sinais de estabilização após turbulências.
   
5. Valor Econômico (12/01/2024): "PIB deve crescer 2,5% em 2024, prevê governo"
   Ministério da Fazenda mantém otimismo com crescimento econômico.
`;

  // ═══════════════════════════════════════════════════════════════
  // TESTE 1: AI Resilience Nexus
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n${BOLD}[1/2] AI RESILIENCE NEXUS${RESET}`);
  console.log('─'.repeat(50));
  
  try {
    const startTime = Date.now();
    const { aiResilienceNexus } = await import('./server/services/ai-resilience-nexus.ts');
    
    const prompt = `
Você é o auditor forense da plataforma Seth VII.
Analise o político LULA (Presidente do Brasil) com base nas fontes abaixo.

${sampleText}

Forneça uma análise técnica em JSON:
{
  "politician": "nome completo",
  "office": "cargo",
  "party": "partido",
  "promises": [
    {"text": "promessa", "status": "cumprida/pendente/não cumprida", "evidence": "fonte"}
  ],
  "credibilityScore": 0-100,
  "verdict": {
    "facts": ["fato comprovado"],
    "concerns": ["preocupação identificada"]
  }
}`;

    const response = await aiResilienceNexus.chat(prompt);
    const elapsed = Date.now() - startTime;
    
    const isBlocked = response.content.toLowerCase().includes("sorry") && response.content.toLowerCase().includes("can't");
    
    if (!isBlocked && response.provider !== 'none') {
      console.log(`${GREEN}✓ SUCESSO via ${response.provider} (${response.model}) em ${elapsed}ms${RESET}`);
      console.log(`\n${CYAN}RESPOSTA COMPLETA:${RESET}`);
      console.log('─'.repeat(50));
      console.log(response.content);
      console.log('─'.repeat(50));
    } else {
      console.log(`${RED}✗ FALHOU - Bloqueado ou sem resposta${RESET}`);
      console.log(`Provider: ${response.provider}`);
      console.log(`Content: ${response.content.substring(0, 200)}`);
    }
  } catch (error: any) {
    console.log(`${RED}✗ ERRO: ${error.message}${RESET}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TESTE 2: AI Service (Análise Estruturada)
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n${BOLD}[2/2] AI SERVICE - ANÁLISE ESTRUTURADA${RESET}`);
  console.log('─'.repeat(50));
  
  try {
    const startTime = Date.now();
    const { aiService } = await import('./server/services/ai.service.ts');
    
    const analysis = await aiService.analyzeText(sampleText);
    const elapsed = Date.now() - startTime;
    
    if (analysis && !analysis.error) {
      console.log(`${GREEN}✓ SUCESSO em ${elapsed}ms${RESET}`);
      console.log(`\n${CYAN}ANÁLISE ESTRUTURADA:${RESET}`);
      console.log('─'.repeat(50));
      console.log(`Credibilidade: ${analysis.credibilityScore}%`);
      console.log(`Sentimento: ${analysis.overallSentiment}`);
      console.log(`\nPromessas (${analysis.promises?.length || 0}):`);
      analysis.promises?.forEach((p: any, i: number) => {
        console.log(`  ${i+1}. ${p.text}`);
        console.log(`     Confiança: ${(p.confidence * 100).toFixed(0)}%`);
        if (p.risks?.length) console.log(`     Riscos: ${p.risks.join(', ')}`);
      });
      console.log(`\nVeredito:`);
      console.log(`  Fatos: ${analysis.verdict?.facts?.join('; ') || 'N/A'}`);
      console.log(`  Ceticismo: ${analysis.verdict?.skepticism?.join('; ') || 'N/A'}`);
    } else {
      console.log(`${RED}✗ FALHOU${RESET}`);
      console.log(`Erro: ${analysis?.message || 'Desconhecido'}`);
    }
  } catch (error: any) {
    console.log(`${RED}✗ ERRO: ${error.message}${RESET}`);
  }

  console.log(`\n${BOLD}${CYAN}════════════════════════════════════════════════════════════${RESET}\n`);
}

testAI().catch(console.error);
