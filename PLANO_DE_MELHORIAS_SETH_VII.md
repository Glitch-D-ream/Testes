# 🚀 Plano de Melhorias: Seth VII (Fase de Otimização)

Este plano visa resolver os gargalos identificados durante a execução no sandbox, focando em **Performance**, **Resiliência** e **Escalabilidade**.

---

### ⚡ 1. Otimização de Performance (Scout & Ingestion)

O maior gargalo atual é a latência na coleta de dados. Propomos as seguintes mudanças:

| Ação | Descrição | Impacto |
|------|-----------|---------|
| **Paralelismo de Ingestão** | Substituir o loop sequencial no `ScoutHybrid` por `Promise.all` com limite de 5 requisições simultâneas. | Redução de ~60% no tempo de busca. |
| **Timeout Inteligente** | Reduzir o timeout global de requisições de 15s para 5s em fontes não-críticas. | Evita travamentos por fontes lentas. |
| **Cache de Extração** | Persistir o conteúdo extraído de PDFs e sites no Supabase para evitar re-scraping da mesma URL. | Resposta instantânea para dados já conhecidos. |

---

### 🧠 2. Resiliência e Inteligência de IA

A cascata de IA é robusta, mas lenta quando chaves estão ausentes.

1.  **Priorização Dinâmica:** Modificar o `ResilienceNexus` para verificar a presença de chaves de API no início do processo e pular provedores não configurados.
2.  **Consolidação de Prompts:** Atualmente, o `Brain Agent` faz múltiplas chamadas de IA. Podemos consolidar a análise de "Votos" e "Gastos" em um único prompt estruturado para economizar tokens e tempo.
3.  **Fallback Local (NLP):** Implementar uma camada básica de extração via `compromise` ou `natural` (já instalados) para quando a rede falhar totalmente.

---

### 🏗 3. Estabilidade de Infraestrutura

1.  **Correção de Dependências:** Adicionar `@napi-rs/canvas` e `pg` ao `package.json` para evitar erros de inicialização em novos ambientes.
2.  **Proxy de Banco de Dados:** Configurar o uso do Supabase SDK como driver principal para operações de dados, reservando o Drizzle apenas para migrações em ambiente controlado.
3.  **Monitoramento de Rate Limit:** Implementar um sistema de "Backoff" no `BrowserScraper` para detectar quando o Google ou Bing começarem a retornar 429 (Too Many Requests).

---

### 📅 Cronograma Sugerido

*   **Semana 1:** Correção de bugs de inicialização e implementação de paralelismo no Scout.
*   **Semana 2:** Otimização da cascata de IA e consolidação de prompts.
*   **Semana 3:** Implementação do cache de extração e monitoramento de rate limit.

---

**Conclusão:** Com estas melhorias, o Seth VII deixará de ser um sistema "lento e pesado" para se tornar uma ferramenta de auditoria ágil, capaz de processar um perfil político completo em menos de 15 segundos.
