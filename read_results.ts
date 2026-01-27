
import { getSupabase } from './server/core/database.ts';

async function read() {
  const s = getSupabase();
  const {data, error} = await s.from('analyses')
    .select('*')
    .ilike('politician_name', '%Lula%')
    .order('created_at', {ascending: false})
    .limit(1);
    
  if (error) {
    console.error(error);
    return;
  }
  console.log(JSON.stringify(data, null, 2));
}

read();
