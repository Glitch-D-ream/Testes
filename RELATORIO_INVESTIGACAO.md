# Relatório de Investigação e Propostas de Melhoria: Detector de Promessa Vazia

**Autor:** Manus AI
**Data:** 24 de Janeiro de 2026
**Projeto:** Detector de Promessa Vazia (Repositório: Glitch-D-ream/Testes)

## 1. Visão Geral do Projeto

O projeto **Detector de Promessa Vazia** é uma plataforma robusta e bem estruturada, desenvolvida em **Node.js/Express.js** (Backend) e **React 19** (Frontend), com foco em segurança, observabilidade e testes automatizados. O objetivo principal é analisar a viabilidade de promessas políticas através de Processamento de Linguagem Natural (PLN) e cruzamento com dados públicos reais (SICONFI, Portal da Transparência, TSE).

A arquitetura é moderna, utilizando **TypeScript**, **Drizzle ORM** e **Supabase/PostgreSQL** como banco de dados de produção. O projeto demonstra um alto nível de maturidade em práticas de desenvolvimento, como a implementação de autenticação JWT, rate limiting, logs de auditoria e métricas Prometheus.

## 2. Análise de Dados Mockados ou Falsos

A investigação concentrou-se no banco de dados de produção do Supabase (`https://ceexfkjldhsbpugxvuyn.supabase.co`) e nos scripts de *seed* do repositório.

### 2.1. Dados no Repositório (SQLite Local)

O repositório contém scripts de *seed* (`seed-nikolas.ts`, `seed_real_data.ts`) que inserem dados de teste no banco de dados SQLite local, como o político "Nikolas Ferreira" e promessas genéricas ("Candidato A", "Candidato B").

> **Conclusão:** Estes dados são **mockados/simulados** e são utilizados **apenas para desenvolvimento e testes locais**. Sua presença é esperada e não representa um problema, desde que não sejam migrados para produção.

### 2.2. Dados no Supabase (Produção)

A análise do banco de dados de produção revelou que a maioria das tabelas está **vazia** (`users`, `politicians`, `promises`, `consents`, `public_data_cache`, `evidence_storage`).

| Tabela | Registros | Amostra | Status |
| :--- | :--- | :--- | :--- |
| `analyses` | 1 | `{"text": "Italo fatais", "author": "Autor Desconhecido", ...}` | **Teste Único** |
| `audit_logs` | 1 | Log de criação da análise acima | **Teste Único** |
| `public_data_cache` | 0 | N/A | **Crítico** |

> **Conclusão:** O banco de dados de produção está **praticamente vazio**, exceto por um único registro de teste na tabela `analyses`. **Não há dados falsos ou mockados em larga escala**.

### 2.3. Impacto da Falta de Dados Reais

A tabela `public_data_cache` está vazia. Esta tabela é crucial, pois armazena os dados sincronizados do SICONFI, Portal da Transparência e TSE.

*   O módulo de cálculo de probabilidade (`server/modules/probability.ts`) depende desses dados para os fatores de **Viabilidade Orçamentária** e **Histórico do Autor**.
*   Sem dados em cache, o sistema está rodando com **scores de *fallback*** (ex: `authorTrack: 0.5` se o histórico não for encontrado), o que compromete a precisão da análise.

> **Correção Imediata Proposta:** **Verificar e corrigir a execução do Job de Sincronização** (`jobs/sync-public-data.ts`) no ambiente Railway para que os dados públicos sejam populados no `public_data_cache`.

## 3. Propostas de Melhoria e Correções

Com base na análise da estrutura do código e das integrações, proponho as seguintes melhorias e correções, organizadas por prioridade:

### 3.1. Correções Críticas (Funcionalidade Central)

| ID | Descrição | Justificativa | Ação Proposta |
| :--- | :--- | :--- | :--- |
| **C1** | **Falha na Sincronização de Dados Públicos** | A tabela `public_data_cache` está vazia, indicando que o job de sincronização (`jobs/sync-public-data.ts`) não está sendo executado ou está falhando no Railway. Isso impede o cálculo de probabilidade baseado em dados reais. | **Verificar logs do Railway** para o job de sincronização. Garantir que as variáveis de ambiente necessárias para as APIs externas (SICONFI, TSE, Portal) estejam configuradas corretamente no Railway. |
| **C2** | **Integração TSE Incompleta/Instável** | O código (`server/integrations/tse.ts`) contém um `logger.warn` indicando que a "API Real do TSE não retornou dados", forçando um *fallback* de `score: 0.5`. Isso é um ponto de falha crítico para o fator **Histórico do Autor**. | **Investigar a API do TSE** e buscar fontes de dados alternativas ou *datasets* públicos para histórico político, ou implementar um *mock* mais robusto para testes de integração, caso a API real seja intermitente. |

### 3.2. Melhorias de Arquitetura e Escalabilidade

| ID | Descrição | Justificativa | Ação Proposta |
| :--- | :--- | :--- | :--- |
| **M1** | **Migração de Banco de Dados** | O `README.md` e o `todo.md` (Fase 6) indicam que o projeto usa SQLite em desenvolvimento e planeja migrar para PostgreSQL em produção. O código (`server/core/database.ts`) já está configurado para Supabase/PostgreSQL, mas o *schema* (`drizzle/schema.ts`) ainda usa tipos de PostgreSQL (`pgTable`, `jsonb`). | **Confirmar se o Supabase está sendo usado como PostgreSQL**. Se sim, a arquitetura está correta. Se o Railway estiver provisionando um SQLite, o projeto falhará. **Recomendação:** Usar o serviço de PostgreSQL do Railway ou o Supabase como planejado. |
| **M2** | **Uso de `jsonb` no Schema** | O *schema* utiliza `jsonb` para campos como `extractedPromises` e `dataSources`. O uso de `jsonb` é excelente para dados semi-estruturados, mas o Drizzle ORM no `database.ts` está usando o SDK do Supabase, que acessa o banco via REST, não via Drizzle. | **Recomendação:** Migrar o `database.ts` para usar o **Drizzle ORM** com o *driver* de PostgreSQL, em vez de usar o SDK REST do Supabase. Isso permitirá aproveitar a tipagem e segurança do Drizzle de forma completa. |
| **M3** | **Configuração de Variáveis de Ambiente** | O arquivo `.env.example` lista diversas chaves de API (GEMINI, GROQ, DEEPSEEK). O `package.json` confirma o uso de `@google/generative-ai`, `groq-sdk`, e `openai`. | **Recomendação:** Criar um arquivo `config.ts` para centralizar o carregamento e validação dessas variáveis, garantindo que o sistema não inicie com chaves de API ausentes ou inválidas. |

### 3.3. Melhorias de Código e Segurança

| ID | Descrição | Justificativa | Ação Proposta |
| :--- | :--- | :--- | :--- |
| **S1** | **Ativação do CSP** | O middleware de *security headers* (`server/core/security-headers.ts`) tem o `Content-Security-Policy` (CSP) comentado com a nota "desabilitado temporariamente para depuração de rede". | **Ativar o CSP** em produção. O CSP é uma defesa essencial contra ataques XSS. |
| **S2** | **Ativação da Proteção CSRF** | O `server/core/routes.ts` tem a proteção CSRF comentada. | **Ativar o middleware `csrfProtection`** nas rotas que modificam o estado (POST, PUT, DELETE) para prevenir ataques *Cross-Site Request Forgery*. |
| **S3** | **Melhoria no PLN (Fatores de Confiança)** | O cálculo de confiança no `NLP_METHODOLOGY.md` usa fatores fixos (ex: `base = 1.0`, `negação_factor = 0.8`). | **Recomendação:** Implementar um modelo de *Machine Learning* (como planejado no *roadmap*) para calcular os pesos dos fatores de forma dinâmica e mais precisa, em vez de usar pesos fixos. |

## 4. Resumo da Investigação

O projeto está em um estágio avançado de desenvolvimento, com uma base técnica sólida e foco em qualidade. A análise dos logs do Railway revelou problemas específicos que já foram corrigidos no código local.

### 5. Análise de Logs do Railway e Correções Aplicadas

Após analisar os logs fornecidos, identifiquei e corrigi os seguintes problemas:

1.  **Erro de Rate Limit (Trust Proxy):**
    *   **Problema:** O `express-rate-limit` estava emitindo um erro `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` porque o Express não estava configurado para confiar no proxy do Railway.
    *   **Correção:** Adicionado `app.set('trust proxy', 1);` no `server/index.ts`. Isso permitirá que o sistema identifique corretamente o IP dos usuários para aplicar os limites de uso.

2.  **Falha na Exportação de Imagem (Chromium):**
    *   **Problema:** O log mostrava `Erro ao exportar Imagem` (Status 500). O código tentava usar um caminho fixo para o Chromium (`/usr/bin/chromium-browser`), que não existe no ambiente padrão do Railway.
    *   **Correção:** Atualizado o `server/services/export.service.ts` para usar a variável de ambiente `PUPPETEER_EXECUTABLE_PATH`.
    *   **Ação Necessária:** No Railway, adicione a variável `PUPPETEER_EXECUTABLE_PATH` apontando para o executável do Chromium instalado (ou instale o Nixpack do Puppeteer).

3.  **Falha nas APIs de IA (Gemini/DeepSeek/Groq):**
    *   **Problema:** Os logs mostram falhas consecutivas em todos os provedores de IA, resultando no uso do NLP local (que é mais simples).
    *   **Causa Provável:** Chaves de API inválidas, expiradas ou falta de saldo nos provedores gratuitos.
    *   **Recomendação:** Verifique as chaves `GEMINI_API_KEY`, `DEEPSEEK_API_KEY` e `GROQ_API_KEY` no painel do Railway.

A ausência de dados reais no cache de produção é o que faz o sistema operar com dados "falsos" (scores de *fallback*), e não a presença de dados mockados no código. As correções acima estabilizam as funcionalidades de segurança e exportação.

---

## Referências

[1] Glitch-D-ream/Testes. (2026). *README.md*. GitHub.
[2] Glitch-D-ream/Testes. (2026). *ARCHITECTURE.md*. GitHub.
[3] Glitch-D-ream/Testes. (2026). *NLP_METHODOLOGY.md*. GitHub.
[4] Glitch-D-ream/Testes. (2026). *server/core/database.ts*. GitHub.
[5] Glitch-D-ream/Testes. (2026). *server/integrations/tse.ts*. GitHub.
[6] Glitch-D-ream/Testes. (2026). *server/core/security-headers.ts*. GitHub.
[7] Glitch-D-ream/Testes. (2026). *server/core/routes.ts*. GitHub.
