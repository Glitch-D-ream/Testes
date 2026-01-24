# 🗺️ Guia de Estado do Projeto: Detector de Promessa Vazia

Este documento serve como referência técnica para o estado atual do ecossistema em **24 de Janeiro de 2026**.

## 🚀 Arquitetura do Ecossistema

O projeto está dividido em quatro pilares integrados:

| Componente | Plataforma | Função | Status |
| :--- | :--- | :--- | :--- |
| **Frontend** | Cloudflare Pages | Interface React 19 + Vite | ✅ Online |
| **Backend/API** | Railway | Motor Express.js + IA | ✅ Online |
| **Banco de Dados** | Supabase | PostgreSQL + Auth + Cache | ✅ Ativo |
| **Bot/Storage** | Telegram | Interface rápida + Nuvem ilimitada | ✅ Configurado |

## 🔗 URLs e Endpoints Oficiais

- **Site Produção:** [detector-promessa-vazia.pages.dev](https://detector-promessa-vazia.pages.dev)
- **API Produção:** `https://testes-production-420c.up.railway.app`
- **Health Check:** `https://testes-production-420c.up.railway.app/api/health`
- **Supabase:** `https://ceexfkjldhsbpugxvuyn.supabase.co`

## 🛠️ Configurações Técnicas Realizadas

### 1. Backend (Railway)
- **Build:** Corrigido para ignorar `node_modules` no Git e usar `pnpm`.
- **Procfile:** Configurado para rodar `node dist/index.js`.
- **Variáveis de Ambiente:** 
  - `SUPABASE_URL` e `SUPABASE_ANON_KEY` configuradas.
  - `GEMINI_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY` ativas para fallback de IA.
  - `ALLOWED_ORIGINS` configurado para aceitar o domínio do Cloudflare.

### 2. Frontend (Cloudflare)
- **VITE_API_URL:** Apontando para o endpoint do Railway.
- **Deploy:** Automatizado via GitHub (branch `master`).

### 3. Integrações de Dados Reais
- **SICONFI:** Módulo `server/integrations/siconfi.ts` cruza promessas com execução orçamentária real.
- **TSE:** Módulo `server/integrations/tse.ts` valida histórico de candidatos.
- **Telegram:** Webhook configurado e ativo via API do Railway.

## 📝 Notas para o Próximo Agente

1. **CORS:** Se houver erro de conexão entre site e API, verifique a variável `ALLOWED_ORIGINS` no Railway.
2. **IA:** O sistema prioriza o Gemini 1.5 Flash. Se falhar, ele tenta DeepSeek e depois Groq.
3. **Storage:** O Telegram é usado para armazenamento ilimitado de arquivos e relatórios gerados.
4. **Banco:** O schema do banco está no Supabase. Verifique `server/models/schema.ts` para a estrutura das tabelas.

---
*Guia gerado por Manus em 24/01/2026.*
