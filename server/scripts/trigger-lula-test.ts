
import { getSupabase, initializeDatabase } from '../core/database.ts';
import { targetDiscoveryService } from '../services/target-discovery.service.ts';
import { nanoid } from 'nanoid';
import { logInfo, logError } from '../core/logger.ts';

async function triggerLulaTest() {
  try {
    await initializeDatabase();
    const supabase = getSupabase();
    const cleanName = 'Lula';

    logInfo(`[Test] Iniciando teste para: ${cleanName}`);

    // 1. Identificação do perfil
    const profile = await targetDiscoveryService.discover(cleanName);
    logInfo(`[Test] Perfil identificado: ${JSON.stringify(profile)}`);

    // 2. Criar registro de análise
    const analysisId = nanoid();
    const { data: newAnalysis, error: insertError } = await supabase
      .from('analyses')
      .insert([{
        id: analysisId,
        politician_name: profile.name,
        office: profile.office,
        party: profile.party,
        state: profile.state,
        status: 'processing',
        progress: 5,
        text: 'Teste manual iniciado por Manus AI...'
      }])
      .select()
      .single();

    if (insertError) throw insertError;
    
    console.log(`ANALYSIS_ID:${analysisId}`);
    console.log(`POLITICIAN_NAME:${profile.name}`);
    console.log(`STATE:${profile.state}`);
    
    process.exit(0);
  } catch (error) {
    logError('[Test] Erro ao disparar teste:', error as Error);
    process.exit(1);
  }
}

triggerLulaTest();
