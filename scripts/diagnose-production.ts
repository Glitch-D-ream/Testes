
import * as dotenv from 'dotenv';
dotenv.config();

async function diagnose() {
  console.log('--- Diagnóstico de Ambiente de Produção (Seth VII) ---');
  console.log('Data:', new Date().toISOString());
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  const githubToken = process.env.GITHUB_TOKEN;
  console.log('GITHUB_TOKEN configurado:', githubToken ? 'Sim (começa com ' + githubToken.substring(0, 4) + ')' : 'Não');
  
  if (githubToken) {
    try {
      console.log('Testando validade do GITHUB_TOKEN via API do GitHub...');
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (response.status === 200) {
        const user = await response.json();
        console.log('✅ Token VÁLIDO!');
        console.log('Usuário GitHub:', user.login);
        
        const scopes = response.headers.get('x-oauth-scopes');
        console.log('Escopos do Token:', scopes);
        
        if (!scopes?.includes('repo') && !scopes?.includes('public_repo')) {
          console.log('❌ ERRO: O token não tem permissão "repo" ou "public_repo".');
        } else if (!scopes?.includes('workflow')) {
          console.log('⚠️ AVISO: O token não tem permissão "workflow". Isso pode ser necessário para disparar Actions.');
        } else {
          console.log('✅ Permissões parecem adequadas.');
        }
      } else {
        console.log(`❌ Token INVÁLIDO! Status: ${response.status}`);
        const error = await response.json();
        console.log('Mensagem de erro:', error.message);
      }
    } catch (err) {
      console.log('❌ Erro ao testar token:', (err as Error).message);
    }
  } else {
    console.log('❌ ERRO: A variável de ambiente GITHUB_TOKEN não foi encontrada.');
    console.log('Certifique-se de que ela está configurada no seu painel de controle (Railway/Vercel/etc).');
  }
  
  console.log('\n--- Verificação de Supabase ---');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Configurado' : 'NÃO CONFIGURADO');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurado' : 'NÃO CONFIGURADO');
  
  console.log('\n--- Fim do Diagnóstico ---');
}

diagnose();
