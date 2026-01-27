
import { getSupabase } from './server/core/database.ts';

async function debug() {
  const s = getSupabase();
  console.log("--- Buscando Erika Hilton ---");
  const {data: erika, error: err1} = await s.from('canonical_politicians').select('*').ilike('name', '%Erika Hilton%');
  console.log("Erika Hilton:", JSON.stringify(erika, null, 2));

  console.log("\n--- Buscando Políticos do PL-MT ---");
  const {data: plmt, error: err2} = await s.from('canonical_politicians').select('*').eq('party', 'PL').eq('state', 'MT').limit(5);
  console.log("PL-MT:", JSON.stringify(plmt, null, 2));
}

debug();
