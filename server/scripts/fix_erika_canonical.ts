
import { getSupabase } from '../core/database.ts';
import { logInfo } from '../core/logger.ts';

async function fixErika() {
  const supabase = getSupabase();
  logInfo('Verificando dados canônicos para Erika Hilton...');

  const { data: existing } = await supabase
    .from('canonical_politicians')
    .select('*')
    .ilike('name', '%Erika Hilton%')
    .maybeSingle();

  if (existing) {
    logInfo(`Encontrado: ${existing.name} (ID: ${existing.id}, Camara: ${existing.camara_id})`);
    
    // Corrigir se necessário
    if (existing.camara_id !== '220645') {
      logInfo('Corrigindo ID da Câmara para 220645...');
      const { error } = await supabase
        .from('canonical_politicians')
        .update({ camara_id: '220645' })
        .eq('id', existing.id);
      if (error) console.error('Erro ao atualizar:', error);
      else logInfo('Atualizado com sucesso!');
    }
  } else {
    logInfo('Erika Hilton não encontrada. Criando registro canônico...');
    const { error } = await supabase
      .from('canonical_politicians')
      .insert([{
        name: 'Erika Hilton',
        camara_id: '220645',
        party: 'PSOL',
        state: 'SP'
      }]);
    if (error) console.error('Erro ao inserir:', error);
    else logInfo('Criado com sucesso!');
  }
}

fixErika();
