
import { createClient } from '@supabase/supabase-js';

const anonKey = "sb_publishable_aJzST2X76MkOdmufmaqb5w_5EkIA3ie";
const secretKey = "sb_secret_xsvh_x1Zog0FPn7urshqbA_IoiXBxR8";

// O ID do projeto geralmente está no meio da chave anon ou secret
// Vamos tentar extrair e testar algumas combinações
console.log("Debug de Chaves Supabase:");

async function testUrl(url: string) {
    try {
        console.log(`Testando URL: ${url}`);
        const supabase = createClient(url, anonKey);
        const { error } = await supabase.from('analyses').select('id').limit(1);
        if (error && error.message.includes('fetch failed')) {
            return false;
        }
        console.log(`✅ URL Válida encontrada: ${url}`);
        if (error) console.log(`Nota: Tabela pode não existir, mas a conexão funcionou: ${error.message}`);
        return true;
    } catch (e) {
        return false;
    }
}

async function run() {
    const ids = ["aJzST2X76MkOdmufmaqb", "xsvh_x1Zog0FPn7urshqbA"];
    for (const id of ids) {
        const url = `https://${id}.supabase.co`;
        if (await testUrl(url)) break;
    }
}

run();
