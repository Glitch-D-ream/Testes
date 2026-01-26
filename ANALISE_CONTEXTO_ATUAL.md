# 📊 Análise do Contexto Atual - Seth VII

**Data:** 26 de Janeiro de 2026  
**Repositório:** Glitch-D-ream/Testes  
**Branch:** master  
**Último Commit:** `819777d5` - "fix: ensure contrastAnalysis and technicalPromises are persisted in data_sources"

---

## 🎯 Visão Geral do Projeto

O **Seth VII** é uma plataforma avançada de auditoria política que analisa promessas e discursos de políticos brasileiros, cruzando declarações públicas com dados oficiais de orçamento, legislação e histórico político.

### Objetivo Principal
Fornecer análises técnicas, imparciais e baseadas em evidências sobre a viabilidade e coerência de promessas políticas, utilizando:
- Dados orçamentários (SICONFI - Tesouro Nacional)
- Dados legislativos (Câmara, Senado, TSE)
- Dados demográficos (IBGE)
- Análise de discurso vs. ação (Diz vs. Faz)

---

## 🏗️ Arquitetura Atual

### Sistema de Tríade de Agentes

O projeto implementa uma arquitetura baseada em três agentes especializados:

#### 1. **Scout Agent** (Coleta de Dados)
- **Localização:** `server/agents/scout*.ts`, `server/agents/scoutAgent.ts`, `server/agents/smartScout.ts`
- **Função:** Busca e coleta informações de fontes oficiais e notícias
- **Fontes:**
  - APIs Governamentais (Câmara, Senado, Portal da Transparência)
  - Fontes institucionais (Base dos Dados, IPEA, IBGE)
  - Mídia confiável (RSS de Agência Brasil, BBC, DW)
- **Características:**
  - Cache em 3 níveis (memória, Supabase, stale fallback)
  - Busca em paralelo com timeouts
  - Sistema de credibilidade hierárquico (Camadas A, B, C)

#### 2. **Filter Agent** (Filtragem e Validação)
- **Localização:** `server/agents/filter.ts`
- **Função:** Limpa ruído e valida relevância das fontes coletadas
- **Características:**
  - Remoção de duplicatas
  - Validação de credibilidade
  - Classificação por força de promessa

#### 3. **Brain Agent** (Análise e Auditoria)
- **Localização:** `server/agents/brain.ts`
- **Função:** Núcleo de inteligência que cruza dados e gera pareceres técnicos
- **Análises Realizadas:**
  - Viabilidade orçamentária (SICONFI)
  - Análise de contraste (Diz vs. Faz)
  - Incoerência temporal (promessas vs. votações)
  - Extração de promessas técnicas de projetos de lei
  - Análise de planos de governo oficiais (TSE)

### Hierarquia de Credibilidade (Camadas)

O sistema implementa um modelo de credibilidade em 3 camadas:

| Camada | Tipo de Fonte | Exemplos | Peso |
|--------|---------------|----------|------|
| **A** | Documentos Oficiais | PLs, votações, atas oficiais | 100% |
| **B** | Fontes Institucionais | Portais governamentais, TSE | 80% |
| **C** | Mídia e Declarações | Notícias, entrevistas, redes sociais | 50% |

---

## 🔧 Stack Tecnológico

### Backend
- **Runtime:** Node.js 22.13.0
- **Framework:** Express.js
- **Linguagem:** TypeScript
- **Banco de Dados:** Supabase (PostgreSQL)
- **ORM:** Drizzle ORM
- **Cache:** Sistema de cache em 3 níveis (memória, DB, stale)
- **Jobs:** node-cron (agendamento)

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite
- **Estilização:** Tailwind CSS 4
- **Gráficos:** Recharts

### Inteligência Artificial

Sistema de fallback em 4 níveis:

1. **Primário:** DeepSeek R1 (raciocínio profundo via OpenRouter)
2. **Secundário:** Pollinations AI (OpenAI/Mistral/Llama)
3. **Backup:** Modelos open source (Llama-3.3-70B, Mistral-Large)
4. **Local:** Motor NLP baseado em Regex

### Integrações com APIs Públicas

- **SICONFI:** Dados orçamentários (Tesouro Nacional)
- **Portal da Transparência:** Gastos e transferências
- **TSE:** Histórico político e planos de governo
- **Câmara dos Deputados:** Projetos de lei e votações
- **Senado Federal:** Projetos e atividade legislativa
- **IBGE:** Dados demográficos e regionais

---

## 📈 Estado Atual do Desenvolvimento

### ✅ Funcionalidades Implementadas

#### Core do Sistema
- [x] Sistema de tríade de agentes (Scout, Filter, Brain)
- [x] Integração com Supabase (PostgreSQL)
- [x] Sistema de cache inteligente (3 níveis)
- [x] Hierarquia de credibilidade (Camadas A, B, C)
- [x] Análise de contraste (Diz vs. Faz)
- [x] Extração de promessas técnicas de PLs
- [x] Análise de planos de governo oficiais

#### Integrações
- [x] SICONFI (orçamentos)
- [x] Portal da Transparência
- [x] TSE (histórico político)
- [x] Câmara dos Deputados
- [x] Senado Federal
- [x] IBGE

#### Segurança e Conformidade
- [x] Autenticação JWT
- [x] Rate limiting
- [x] Logging e auditoria (Winston)
- [x] Validação de entrada (Zod)
- [x] Headers de segurança
- [x] Conformidade LGPD

#### Automação
- [x] GitHub Actions para Scout Worker
- [x] Job agendado a cada 6 horas
- [x] Sincronização automática de dados públicos
- [x] Cold storage de histórico

#### Testes
- [x] 360+ casos de teste
- [x] Testes unitários (Vitest)
- [x] Testes E2E (Playwright)
- [x] Testes de carga (k6)
- [x] Cobertura 70%+

### 🚧 Em Desenvolvimento / Roadmap

#### Otimizações de Performance (Curto Prazo)
- [ ] Paralelismo de rede no ContentScraper
- [ ] Redução de timeouts de APIs (15s → 5s)
- [ ] Pré-processamento local com NLP
- [ ] Consolidação de prompts de IA

#### Melhorias de Arquitetura (Médio Prazo)
- [ ] Cache de conteúdo bruto (24h)
- [ ] Vetorização (RAG) para histórico político
- [ ] Streaming de resposta (WebSockets)
- [ ] Arquitetura de workers (BullMQ/Redis)

#### UX/UI (Médio Prazo)
- [ ] Modo escuro completo
- [ ] Validação em tempo real
- [ ] Loading states aprimorados
- [ ] Acessibilidade WCAG 2.1 AA

#### Escalabilidade (Longo Prazo)
- [ ] Migração para PostgreSQL standalone (se necessário)
- [ ] Redis para cache distribuído
- [ ] Nginx load balancing
- [ ] Containerização completa (Docker)

---

## 🔍 Análise dos Commits Recentes

### Últimos 5 Commits (Janeiro 2026)

1. **819777d5** - "fix: ensure contrastAnalysis and technicalPromises are persisted in data_sources"
   - Correção de persistência de dados no Brain Agent
   - Garantia de que análises de contraste sejam salvas corretamente

2. **88521b6a** - "feat: implement government plan extraction and improve data integrity"
   - Implementação de extração de planos de governo
   - Melhorias na integridade de dados

3. **7011cde8** - "feat: implement hierarchical credibility layers in Scout and Inaction Verdict in Brain"
   - Sistema de camadas de credibilidade (A, B, C)
   - Veredito de inação no Brain

4. **0e14fe55** - "fix: ensure promises are saved and displayed correctly with AI and NLP fallbacks"
   - Correção de salvamento de promessas
   - Fallbacks de IA e NLP

5. **b88c1e56** - "fix: optimize AI resilience and fix project field mapping"
   - Otimização de resiliência de IA
   - Correção de mapeamento de campos

### Tendências Identificadas

- **Foco em Estabilidade:** Múltiplas correções de persistência e integridade de dados
- **Blindagem Anti-Alucinação:** Implementação de diretrizes rigorosas para IA
- **Neutralidade Técnica:** Remoção de viés emocional nos relatórios
- **Resiliência:** Sistema de fallbacks para garantir 100% de disponibilidade

---

## 🔐 Configuração de Credenciais

### Status Atual

✅ **Credenciais Fornecidas:**
- Supabase URL
- Supabase Service Role Key
- Supabase Anon Key
- GitHub Token (para Actions)

✅ **Arquivos Criados:**
- `.env` com todas as credenciais configuradas
- `CREDENTIALS_CONFIG.md` com documentação detalhada
- `server/scripts/test-supabase-connection.ts` para validação

✅ **Segurança:**
- `CREDENTIALS_CONFIG.md` adicionado ao `.gitignore`
- `.env` já estava no `.gitignore`

### GitHub Actions - Scout Worker

O workflow `scout.yml` está configurado para:
- Executar a cada 6 horas (cron: `0 */6 * * *`)
- Permitir execução manual via `workflow_dispatch`
- Usar secrets do GitHub para credenciais sensíveis

**Secrets Necessários no GitHub:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY` (para IA)

---

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

1. **politicians** - Cadastro de políticos
   - Informações básicas (nome, partido, cargo, região)
   - Score de credibilidade
   - Integração com TSE

2. **analyses** - Análises realizadas
   - Texto analisado
   - Promessas extraídas
   - Score de probabilidade
   - Notas metodológicas
   - Fontes de dados

3. **promises** - Promessas identificadas
   - Texto da promessa
   - Categoria
   - Score de confiança
   - Entidades extraídas
   - Evidências e fontes
   - Incoerências legislativas

4. **users** - Usuários do sistema
   - Autenticação
   - Roles (user, analyst, admin)

5. **public_data_cache** - Cache de dados públicos
   - SICONFI, TSE, IBGE, etc.
   - Controle de expiração

6. **evidence_storage** - Armazenamento de evidências
   - Arquivos do Telegram
   - Documentos e imagens

---

## 🚀 Próximos Passos Recomendados

### 1. Validação de Infraestrutura (Imediato)

```bash
# 1. Testar conexão com Supabase
pnpm tsx server/scripts/test-supabase-connection.ts

# 2. Verificar schema do banco
# Acessar Supabase Dashboard e confirmar que todas as tabelas existem

# 3. Executar migrações se necessário
pnpm db:push
```

### 2. Configuração de Secrets no GitHub (Imediato)

Acessar: `https://github.com/Glitch-D-ream/Testes/settings/secrets/actions`

Adicionar:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY` (se disponível)

### 3. Teste do Scout Worker (Curto Prazo)

```bash
# Executar localmente primeiro
pnpm tsx server/scripts/scout-worker.ts

# Depois testar via GitHub Actions
gh workflow run scout.yml
```

### 4. Otimizações de Performance (Médio Prazo)

Implementar conforme descrito no `SETH_VII_TECHNICAL_REPORT_JAN2026.md`:
- Paralelismo no ContentScraper
- Ajuste de timeouts
- Pré-processamento local

### 5. Monitoramento e Observabilidade (Médio Prazo)

- Configurar Sentry para error tracking
- Implementar Prometheus para métricas
- Configurar alertas automáticos

---

## 📝 Documentação Disponível

O projeto possui documentação extensa:

- **README.md** - Visão geral e quick start
- **ARCHITECTURE.md** - Arquitetura detalhada
- **API.md** - Documentação de endpoints
- **CONTRIBUTING.md** - Guia para contribuidores
- **DEPLOYMENT.md** - Guia de deploy
- **NLP_METHODOLOGY.md** - Metodologia de PLN
- **OBSERVABILITY.md** - Monitoramento e métricas
- **SETH_VII_TECHNICAL_REPORT_JAN2026.md** - Relatório técnico atual
- **README_SMART_SCOUT.md** - Documentação do Scout
- **todo.md** - Roadmap completo

---

## 🎯 Conclusão

O **Seth VII** é um projeto maduro e bem estruturado, com:

✅ **Pontos Fortes:**
- Arquitetura sólida e escalável
- Cobertura de testes excepcional (360+ casos)
- Integrações robustas com APIs públicas
- Sistema de fallback resiliente
- Documentação completa
- Automação via GitHub Actions

⚠️ **Pontos de Atenção:**
- Latência elevada (30-90s por análise)
- Necessidade de otimização de paralelismo
- Dependência de APIs externas instáveis

🚀 **Potencial:**
- Sistema único no mercado brasileiro
- Impacto social significativo
- Base técnica sólida para expansão
- Pronto para escala com ajustes de performance

---

**Análise realizada por:** Seth VII  
**Data:** 26 de Janeiro de 2026

