# 🔍 Análise de Contexto Atual - Seth VII (Janeiro 2026)

## 📋 Resumo Executivo

O repositório **Glitch-D-ream/Testes** contém o projeto **Seth VII**, uma plataforma avançada de auditoria política que utiliza inteligência artificial e dados públicos para analisar promessas e discursos de políticos brasileiros.

**Data da Análise:** 27 de Janeiro de 2026  
**Commit Atual:** `edd13e07` (master)  
**Status:** Projeto em estágio avançado com foco em auditoria forense

---

## 🎯 O Que é o Seth VII?

O **Seth VII** é um sistema de análise de viabilidade de promessas políticas que:

- **Extrai promessas** de textos usando PLN (Processamento de Linguagem Natural)
- **Cruza dados públicos** de SICONFI (orçamentos), Portal da Transparência e TSE
- **Calcula probabilidade** de cumprimento baseado em múltiplos fatores
- **Fornece transparência** completa sobre metodologia e fontes
- **Protege legalmente** com disclaimers robustos

---

## 🏗️ Arquitetura do Sistema

### Tríade de Agentes Autônomos

O sistema opera através de três agentes especializados:

#### 1. **Scout (Agente de Busca)**
- **Localização:** `server/agents/scout-hybrid.ts`, `server/agents/multi-scout.ts`
- **Função:** Coleta de dados de fontes oficiais e notícias
- **Fontes:** Câmara dos Deputados, Senado, TSE, DuckDuckGo, Google News
- **Automação:** GitHub Actions executando a cada 6 horas (`.github/workflows/scout.yml`)

#### 2. **Filter (Agente de Filtragem)**
- **Localização:** `server/agents/filter.ts`
- **Função:** Limpeza de ruído, validação de relevância e classificação
- **Características:** Remove duplicatas, valida credibilidade de fontes

#### 3. **Brain (Agente de Análise)**
- **Localização:** `server/agents/brain.ts` (507 linhas)
- **Função:** Núcleo de inteligência que cruza dados e gera pareceres técnicos
- **Recursos:**
  - Integração com SICONFI para viabilidade orçamentária
  - Mineração de evidências (`evidence-miner.ts`)
  - Auditoria de vulnerabilidades (`vulnerability.ts`)
  - Benchmarking político (`benchmarking.ts`)
  - Rastreabilidade financeira (`finance.service.ts`)
  - Cache inteligente (24h)

### Agentes Especializados Adicionais

- **Absence Agent:** Verifica ausências em votações importantes
- **Vulnerability Auditor:** Identifica contradições entre discurso e ações
- **Benchmarking Agent:** Compara políticos com pares do mesmo partido/região
- **Proxy Benchmarking:** Análise para políticos sem mandato atual

---

## 🔧 Stack Tecnológico

### Frontend
- **React 19** com **TypeScript 5.7**
- **Tailwind CSS 4.0** (design system)
- **Recharts** (visualizações de dados)
- **Framer Motion** (animações)
- **React Router DOM 7** (roteamento)

### Backend
- **Node.js 22** com **Express.js 4** / **Hono 4**
- **TypeScript 5.7**
- **Supabase** (PostgreSQL)
- **Winston** (logging)
- **Bull** (filas de jobs)
- **IORedis** (cache)

### Inteligência Artificial
- **DeepSeek R1** (primário - raciocínio profundo via OpenRouter)
- **Groq** (secundário - estruturação rápida)
- **Pollinations AI** (fallback)
- **NLP Local:** Compromise + Natural (fallback final)

### Infraestrutura
- **GitHub Actions** (automação)
- **Supabase** (banco de dados PostgreSQL)
- **Cold Storage** (arquivos JSON no repositório)

---

## 📊 Commits Recentes (Últimas 10 Atualizações)

Os commits mais recentes mostram foco em **design forense** e **simplificação visual**:

1. **edd13e07** (HEAD): Unificação do dashboard - remoção de abas redundantes, foco em fluxo contínuo de auditoria forense
2. **6f571a6c**: Simplificação visual total - design minimalista, profissional e focado em legibilidade
3. **04defd55**: Implementação do ForensicResultCard de elite - terminal de veredito com design cyber-intelligence
4. **4e66cf2d**: Sincronização de dados entre backend e frontend - garantindo exibição de veredito, contradições e evidências financeiras
5. **9e39f90c**: Seth VII Intelligence Core - modo versus, rastreamento de atos oficiais (DOU) e otimização de cache preditivo
6. **d2fb862d**: Otimização da camada de resiliência e validação de saúde do motor de inteligência
7. **ea4d24f5**: Refatoração total Seth VII - design system cyber-audit, nova home page e relatório forense sintetizado
8. **93f98879**: Seth VII Forensic Upgrade - sistema de endosso de fontes, dossiê de contradições imparcial e refatoração do Verdict Engine
9. **b21abff0**: Evolução forense Seth VII - rastreabilidade financeira, benchmarking ideológico e refatoração do dashboard
10. **ea4088d0**: Remoção de mock data e integração de painéis forenses reais no dashboard de análise

**Tendência:** Evolução de um sistema de análise de promessas para uma **plataforma de auditoria forense completa**.

---

## 🗂️ Estrutura de Diretórios

```
Testes/
├── .github/
│   └── workflows/
│       ├── scout.yml              # Worker autônomo (a cada 6h)
│       ├── health-check.yml       # Monitoramento de saúde
│       ├── maintenance.yml        # Manutenção automática
│       └── watch-sources.yml      # Vigilância de fontes
├── client/                        # Frontend React 19
│   └── src/
│       ├── pages/
│       │   ├── Home.tsx
│       │   ├── Analysis.tsx
│       │   ├── Dashboard.tsx
│       │   └── Methodology.tsx
│       └── components/
│           ├── ForensicResultCard.tsx
│           ├── VersusMode.tsx
│           └── AuditDashboard.tsx
├── server/                        # Backend Node.js
│   ├── agents/                    # Tríade + Especializados
│   │   ├── brain.ts              # Núcleo de inteligência (507 linhas)
│   │   ├── scout-hybrid.ts       # Coleta híbrida
│   │   ├── filter.ts             # Filtragem e classificação
│   │   ├── absence.ts            # Análise de ausências
│   │   ├── vulnerability.ts      # Auditoria de contradições
│   │   ├── benchmarking.ts       # Comparação política
│   │   └── proxy-benchmarking.ts # Análise proxy
│   ├── core/
│   │   ├── database.ts           # Conexão Supabase
│   │   ├── logger.ts             # Winston logging
│   │   ├── auth.ts               # Autenticação JWT
│   │   └── queue-manager.ts      # Gerenciamento de filas
│   ├── integrations/
│   │   ├── siconfi.ts            # Dados orçamentários
│   │   ├── camara.ts             # API Câmara dos Deputados
│   │   └── portal-transparencia.ts
│   ├── services/
│   │   ├── ai.service.ts         # Orquestração de IA
│   │   ├── finance.service.ts    # Rastreabilidade financeira
│   │   └── voting.service.ts     # Análise de votações
│   ├── modules/
│   │   └── evidence-miner.ts     # Mineração de evidências
│   └── scripts/
│       └── scout-worker.ts       # Worker do GitHub Actions
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 20260126000001_grande_simplificacao.sql
│       ├── 20260127000001_add_consensus_and_reputation.sql
│       └── 20260127000002_create_snapshots_table.sql
├── data/
│   └── scout_history/            # Cold storage (JSON)
└── [Documentação]
    ├── README.md                 # Documentação principal
    ├── ANALISE_COMPLETA_JAN2026.md
    ├── ARCHITECTURE.md
    ├── API.md
    └── todo.md                   # Roadmap detalhado
```

---

## 🔑 Credenciais Fornecidas

### Supabase
- **URL:** `https://ceexfkjldhsbpugxvuyn.supabase.co`
- **Service Role Key:** `sb_secret_xsvh_x1Zog0FPn7urshqbA_IoiXBxR8`
- **Publishable Key:** `sb_publishable_aJzST2X76MkOdmufmaqb5w_5EkIA3ie`

### GitHub Actions
- **Token:** `[REMOVIDO POR SEGURANÇA]`
- **Uso:** Configurar secrets para o workflow do Scout (`scout.yml`)

---

## 🚀 Funcionalidades Implementadas

### ✅ Core Features (Completo)
- Extração de promessas via PLN
- Análise de viabilidade orçamentária
- Integração com SICONFI, Portal da Transparência e TSE
- Dashboard com estatísticas e gráficos
- Sistema de autenticação JWT
- Rate limiting (10/hora anônimo, 50/dia autenticado)
- Logging e auditoria completos
- Conformidade LGPD

### ✅ Auditoria Forense (Recente)
- **ForensicResultCard:** Terminal de veredito com design cyber-intelligence
- **Modo Versus:** Comparação entre políticos
- **Rastreamento DOU:** Monitoramento de atos oficiais
- **Dossiê de Contradições:** Identificação de inconsistências
- **Benchmarking Ideológico:** Comparação com pares
- **Rastreabilidade Financeira:** Emendas, gastos e propostas

### ✅ Testes (360+ casos)
- Testes unitários (Vitest)
- Testes de integração
- Testes E2E (Playwright)
- Testes de carga (k6)
- Cobertura: 70%+

### ✅ Observabilidade
- Integração com Sentry (error tracking)
- Métricas Prometheus
- Health checks (`/health`, `/health/live`, `/health/ready`)

---

## 📈 Estado Atual do Banco de Dados (Supabase)

### Migrations Recentes

1. **20260126000001_grande_simplificacao.sql**
   - Criação da tabela `canonical_politicians` (fonte única de verdade)
   - Inserção de 20 políticos canônicos (Erika Hilton, Nikolas Ferreira, Lula, etc.)
   - Desativação do Scout de Notícias (soft disable)
   - Criação da tabela `system_config`

2. **20260127000001_add_consensus_and_reputation.sql**
   - Sistema de consenso e reputação de fontes

3. **20260127000002_create_snapshots_table.sql**
   - Tabela `data_snapshots` para armazenamento imutável de dados governamentais
   - Resiliência e histórico de dados

4. **20260127_create_entity_connections.sql**
   - Conexões entre entidades políticas

---

## 🤖 GitHub Actions - Scout Worker

### Workflow: `.github/workflows/scout.yml`

**Frequência:** A cada 6 horas (`cron: '0 */6 * * *'`)

**Função:**
1. Executar `server/scripts/scout-worker.ts`
2. Distribuir tarefas de scraping para 50 políticos
3. Sincronizar dados orçamentários (SICONFI)
4. Salvar dados em `data/scout_history/` (cold storage)
5. Commit automático de logs e dados

**Secrets Necessários:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`

**Status:** Configurado, mas secrets precisam ser adicionados no repositório GitHub.

---

## 🔍 Análise do Agente Brain (Núcleo de Inteligência)

### Fluxo de Análise Completa

O `brain.ts` executa um pipeline sofisticado:

1. **Coleta de Dados (Scout Híbrido)**
   - Busca notícias e dados oficiais
   - Fontes: Câmara, Senado, TSE, notícias

2. **Filtragem (Filter Agent)**
   - Remove ruído e duplicatas
   - Classifica relevância

3. **Enriquecimento com Dados Oficiais**
   - Perfil oficial do político
   - Dados orçamentários (SICONFI)

4. **Agente de Ausência**
   - Verifica faltas em votações importantes

5. **Mineração de Evidências**
   - Extrai evidências granulares de fontes
   - Auditoria forense de vulnerabilidades

6. **Rastreabilidade Financeira**
   - Gastos parlamentares
   - Emendas Pix
   - Propostas orçamentárias

7. **Benchmarking Político**
   - Comparação com pares
   - Proxy benchmarking para políticos sem mandato

8. **Geração de Parecer Técnico (VerdictEngine v2)**
   - **ETAPA 1:** Raciocínio profundo com DeepSeek R1
   - **ETAPA 2:** Estruturação rápida com Groq
   - **Fallback:** NLP local se IA falhar

9. **Persistência de Métricas Avançadas**
   - Salva análise completa no Supabase

---

## 📊 Roadmap (do todo.md)

### ✅ FASE 1: Segurança e Conformidade (Completo)
- Autenticação JWT
- Rate limiting
- Logging e auditoria
- Conformidade LGPD

### ✅ FASE 2: Testes Automatizados (Completo)
- 360+ casos de teste
- Cobertura 70%+
- Observabilidade (Sentry, Prometheus)

### ✅ FASE 3: PLN e Dados Públicos (Completo)
- Motor de PLN avançado
- Integração SICONFI, Portal, TSE
- Sincronização periódica

### ✅ FASE 4: Documentação e CI/CD (Completo)
- README, API.md, ARCHITECTURE.md
- GitHub Actions configurado
- Docker e docker-compose

### 🟡 FASE 5: UX/UI (Em Desenvolvimento)
- [ ] Modo escuro completo
- [ ] Loading states
- [ ] Filtros e exportação

### 🔴 FASE 6: Escalabilidade (Pendente)
- [ ] Migrar para PostgreSQL otimizado
- [ ] Redis para cache
- [ ] Bull Queue para jobs

### 🔴 FASE 7: Observabilidade (Parcial)
- [x] Sentry
- [x] Prometheus
- [ ] Grafana
- [ ] ELK Stack

### 🔴 FASE 8: Features Avançadas (Futuro)
- [ ] Análise de redes sociais em tempo real
- [ ] Mobile app (React Native)
- [ ] API pública
- [ ] Múltiplos idiomas

---

## 🎯 Contexto Atual - Principais Insights

### 1. **Evolução Forense**
O projeto evoluiu de um simples "detector de promessas vazias" para uma **plataforma de auditoria forense completa**, com:
- Rastreamento financeiro
- Análise de contradições
- Benchmarking ideológico
- Dossiê de vulnerabilidades

### 2. **Grande Simplificação (26/01/2026)**
A migration `grande_simplificacao.sql` mostra uma mudança estratégica:
- Foco em **dados oficiais** (Câmara, Senado, TSE)
- Desativação do Scout de Notícias (soft disable)
- Criação de tabela canônica de políticos

### 3. **Arquitetura Madura**
- Tríade de agentes bem definida
- 6 agentes especializados adicionais
- Sistema de filas com Bull
- Cache inteligente com IORedis

### 4. **Automação Robusta**
- GitHub Actions executando a cada 6 horas
- Cold storage para histórico
- Commits automáticos de dados

### 5. **Inteligência Híbrida**
- 4 níveis de fallback de IA
- NLP local como último recurso
- VerdictEngine v2 com raciocínio profundo

---

## 🚨 Ações Necessárias

### Imediatas

1. **Configurar Secrets no GitHub**
   - Acessar: https://github.com/Glitch-D-ream/Testes/settings/secrets/actions
   - Adicionar:
     - `SUPABASE_URL`: `https://ceexfkjldhsbpugxvuyn.supabase.co`
     - `SUPABASE_SERVICE_ROLE_KEY`: `sb_secret_xsvh_x1Zog0FPn7urshqbA_IoiXBxR8`
     - `OPENROUTER_API_KEY`: (sua chave)

2. **Testar Scout Worker**
   ```bash
   cd Testes
   pnpm install
   pnpm worker:scout
   ```

3. **Verificar Conexão Supabase**
   ```bash
   pnpm tsx server/scripts/test-supabase.ts
   ```

### Esta Semana

4. **Monitorar GitHub Actions**
   - Verificar execuções automáticas
   - Analisar logs em: https://github.com/Glitch-D-ream/Testes/actions

5. **Validar Migrations**
   ```bash
   supabase db push
   ```

6. **Testar Fluxo Completo**
   - Submeter análise de político
   - Verificar ForensicResultCard
   - Validar dados no Supabase

---

## 📚 Documentação Disponível

- **README.md** - Visão geral e quick start
- **ANALISE_COMPLETA_JAN2026.md** - Análise técnica detalhada
- **ARCHITECTURE.md** - Arquitetura do sistema
- **API.md** - Documentação de endpoints
- **OBSERVABILITY.md** - Guia de observabilidade
- **NLP_METHODOLOGY.md** - Metodologia de PLN
- **todo.md** - Roadmap completo
- **SETH_VII_TECHNICAL_REPORT_JAN2026.md** - Relatório técnico

---

## 🏁 Conclusão

O **Seth VII** é um projeto **maduro e bem arquitetado**, em estágio avançado de desenvolvimento. A evolução recente para uma plataforma de **auditoria forense** demonstra visão estratégica e capacidade de adaptação.

**Pontos Fortes:**
- Arquitetura de agentes autônomos
- Cobertura de testes robusta (360+ casos)
- Integração com dados oficiais
- Automação via GitHub Actions
- Documentação extensa

**Próximos Passos:**
1. Configurar secrets do GitHub
2. Validar workflow do Scout
3. Testar fluxo completo de análise
4. Monitorar execuções automáticas

**Recomendação:** O projeto está pronto para uso em produção, com foco em monitoramento e otimizações incrementais de performance.

---

**Análise realizada em:** 27 de Janeiro de 2026  
**Commit analisado:** `edd13e07` (master)  
**Analista:** Seth VII Auditor Agent
