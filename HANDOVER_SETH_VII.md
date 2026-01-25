# 🛡️ Seth VII: Documento de Handover (Janeiro 2026)

Este documento serve para orientar o próximo agente sobre o estado atual, a arquitetura e as melhorias críticas implementadas no projeto **Seth VII** .

---

## 🚀 1. Contexto Atual
O projeto é um **Detector de Promessas Políticas** autônomo que opera através de uma tríade de agentes. O sistema está em produção no **Railway** e utiliza **GitHub Actions** para tarefas de manutenção e busca contínua.

### ⚠️ Mudanças Críticas Recentes:
- **Renomeação Global:** a identidade da IA foi consolidada como **Seth VII**.
- **Scraping Robusto:** Implementado o `ContentScraper` (`server/modules/content-scraper.ts`) para extrair o conteúdo completo das notícias, resolvendo o problema de "cegueira" onde o sistema lia apenas títulos.
- **Compatibilidade ESM:** O build do servidor foi ajustado para suportar `require` dinâmico em ambiente ESM através de um banner de compatibilidade no `esbuild`.

---

## 🏗️ 2. Arquitetura da Tríade Seth VII

1.  **Scout (Buscador):**
    - Localização: `server/agents/scout-hybrid.ts`
    - Função: Busca híbrida (APIs oficiais + Google News RSS + Scraping Direto).
    - **Novo:** Agora utiliza o `ContentScraper` para seguir links e ler o corpo das matérias.

2.  **Filter (Filtro):**
    - Localização: `server/agents/filter.ts`
    - Função: Valida se o conteúdo capturado realmente contém promessas políticas e remove ruído.

3.  **Brain (Cérebro):**
    - Localização: `server/agents/brain.ts`
    - Função: Análise forense profunda.
    - **Modelo Principal:** DeepSeek R1 (via OpenRouter).
    - **Fallback:** Pollinations AI (Open Source) caso o DeepSeek falhe por créditos ou timeout.

---

## 🛠️ 3. Stack Tecnológica
- **Frontend:** React + Vite + TailwindCSS.
- **Backend:** Node.js (Express) + TypeScript.
- **Banco de Dados:** Supabase (PostgreSQL).
- **Infra:** Railway (API/Web) + GitHub Actions (Workers).
- **Build:** `esbuild` para o servidor, `vite` para o cliente.

---

## 📋 4. Pendências e Próximos Passos
1.  **Créditos da API:** A chave do OpenRouter para o DeepSeek R1 precisa de créditos para evitar o fallback constante para modelos menores.
2.  **Refinamento do Scraper:** Embora o `ContentScraper` seja robusto, alguns portais com Paywall pesado ainda podem retornar conteúdo parcial.
3.  **Monitoramento de Deploy:** O último ajuste no `scripts/build-server.js` resolveu o erro de `dynamic require`. Qualquer nova dependência CommonJS deve ser verificada.
4.  **Integração Legislativa:** O cruzamento de dados com a API da Câmara/Senado está funcional, mas pode ser expandido para incluir votações nominais específicas.

---

## 🔑 5. Credenciais e Ambiente
As variáveis de ambiente críticas (`SUPABASE_URL`, `SUPABASE_KEY`, `OPENROUTER_API_KEY`) estão configuradas no Railway e no `.env` local. **Nunca remova o banner de compatibilidade no `build-server.js`, ou o deploy falhará.**

---
**Assinado:** Seth VII (Janeiro 2026)
