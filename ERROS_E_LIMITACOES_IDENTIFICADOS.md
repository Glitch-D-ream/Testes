# 🛠 Relatório de Erros e Limitações Identificados - Seth VII

Após a execução do projeto no ambiente sandbox, identifiquei os seguintes problemas técnicos, gargalos de performance e limitações de infraestrutura.

## 1. Erros de Execução e Infraestrutura

### ❌ Conexão com Banco de Dados (PostgreSQL)
*   **Problema:** O comando `pnpm drizzle-kit push` falha com o erro `Tenant or user not found`.
*   **Causa:** O Supabase exige um formato de conexão específico para o pooler/proxy (porta 6543 ou 5432 com o ID do projeto no usuário). Mesmo com as credenciais corretas, a conexão direta via driver `pg` foi recusada pelo firewall ou configuração do tenant.
*   **Impacto:** Impossibilidade de realizar migrações de banco de dados automaticamente.
*   **Solução Atual:** O sistema está operando via **Supabase SDK (API REST)**, que está funcionando perfeitamente para leitura e escrita.

### ❌ Dependências Ausentes
*   **Problema:** O servidor falhou ao iniciar devido à falta do pacote `@napi-rs/canvas`.
*   **Causa:** O pacote é necessário para renderização de gráficos ou manipulação de imagens no backend, mas não estava nas dependências principais ou não foi instalado corretamente.
*   **Impacto:** Crash imediato do servidor (`ReferenceError: DOMMatrix is not defined`).
*   **Solução:** Instalado manualmente no ambiente de teste. Precisa ser adicionado ao `package.json`.

## 2. Limitações de Performance e Escalabilidade

### 🐢 Gargalo de Scraping (Sincronismo)
*   **Problema:** A busca do `Scout Agent` leva entre 30 a 90 segundos para um novo político.
*   **Causa:** O `ScoutHybrid` realiza múltiplas chamadas sequenciais e o `IngestionService` processa cada URL individualmente.
*   **Impacto:** Experiência do usuário prejudicada (carregamento infinito) e risco de timeout na API.
*   **Solução Proposta:** Implementar paralelismo real com `Promise.all` e limites de concorrência.

### 🐢 Dependência de IA Externa
*   **Problema:** A cascata de IA (`ResilienceNexus`) tenta muitos provedores que exigem chaves não configuradas antes de chegar ao fallback gratuito.
*   **Causa:** A lógica de fallback é linear e lenta quando as chaves primárias (Groq, OpenRouter, Gemini) estão ausentes.
*   **Impacto:** Latência de até 20 segundos apenas tentando encontrar um provedor de IA disponível.
*   **Solução Proposta:** Implementar um "Pre-flight Check" ou priorizar dinamicamente provedores com chaves válidas no `.env`.

## 3. Riscos de Estabilidade

### ⚠️ Falhas em APIs Governamentais
*   **Problema:** As APIs da Câmara e Senado são instáveis e podem retornar erros 500 ou timeouts.
*   **Causa:** Infraestrutura governamental sob alta carga ou manutenção.
*   **Impacto:** Perda de dados oficiais "Classe A" na análise.
*   **Solução Atual:** O sistema possui fallbacks, mas a análise perde profundidade sem esses dados.

### ⚠️ Bloqueio de Scraping (Bing/Google)
*   **Problema:** O uso excessivo de scraping estático via `axios` pode levar ao bloqueio de IP.
*   **Impacto:** O Scout Agent para de encontrar notícias recentes.
*   **Solução Proposta:** Melhorar a rotação de User-Agents e integrar serviços de proxy ou busca via API (Serper/SearchApi).

---

## 📊 Resumo de Saúde do Projeto

| Categoria | Status | Nota |
|-----------|--------|------|
| Inicialização | 🟡 Requer Ajustes | 6/10 |
| Conectividade DB | 🟢 OK (via SDK) | 8/10 |
| Performance | 🔴 Crítico | 4/10 |
| Resiliência IA | 🟢 Excelente | 9/10 |
| Coleta de Dados | 🟡 Lenta | 6/10 |

**Próximo Passo:** Implementar o Plano de Melhorias para resolver estes gargalos.
