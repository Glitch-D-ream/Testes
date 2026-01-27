
import { getSupabase } from '../core/database.ts';
import * as dotenv from 'dotenv';

dotenv.config();

async function fetchResult() {
  const politician = "Arthur Lira";
  const supabase = getSupabase();

  console.log(`Buscando últimas análises para: ${politician}...`);
  const { data, error } = await supabase
    .from('analyses')
    .select('id, author, created_at, status')
    .ilike('author', `%${politician}%`)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Erro ao buscar análises:", error.message);
    return;
  }

  console.log("Últimas análises encontradas:");
  console.table(data);

  if (data && data.length > 0) {
    const { data: fullData } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', data[0].id)
      .single();
    console.log("\nConteúdo da análise mais recente:");
    console.log(JSON.stringify(fullData, null, 2));
  }
}

fetchResult().then(() => process.exit(0));
