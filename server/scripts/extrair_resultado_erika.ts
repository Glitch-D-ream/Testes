
import { getSupabase, initializeDatabase } from '../core/database.ts';

async function extrair() {
  await initializeDatabase();
  const supabase = getSupabase();

  const { data: analyses, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('politician_name', 'Erika Hilton')
    .order('created_at', { ascending: false })
    .limit(1);

  if (analyses && analyses.length > 0) {
    const analysis = analyses[0];
    console.log('\n=== RESULTADO DA AUDITORIA: ERIKA HILTON ===');
    console.log(`ID: ${analysis.id}`);
    console.log(`Político: ${analysis.politician_name}`);
    console.log(`Score de Consistência: ${analysis.probability_score}`);
    
    console.log('\n--- PARECER TÉCNICO (DEEPSEEK-R1) ---');
    console.log(analysis.text);

    if (analysis.data_sources) {
        const ds = typeof analysis.data_sources === 'string' ? JSON.parse(analysis.data_sources) : analysis.data_sources;
        console.log('\n--- DADOS OFICIAIS CRUZADOS ---');
        console.log(`Veredito Orçamentário: ${ds.budgetVerdict}`);
        console.log(`Resumo Orçamentário: ${ds.budgetSummary}`);
        console.log(`Auditoria de Contradições: ${ds.contrastAnalysis}`);
    }
  } else {
    console.log('Nenhuma análise encontrada para Erika Hilton.');
  }
}

extrair();
