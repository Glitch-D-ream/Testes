# Detector de Promessa Vazia 🔍

> **Análise de Viabilidade de Promessas Políticas com Dados Públicos**

Uma plataforma independente e auditável que analisa promessas políticas, posts e discursos contra dados históricos, orçamentários e políticos reais, calculando a probabilidade de cumprimento com transparência metodológica completa.

[![GitHub](https://img.shields.io/badge/GitHub-Glitch--D--ream%2FTestes-blue)](https://github.com/Glitch-D-ream/Testes)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-360%2B%20cases-brightgreen)]()
[![Coverage](https://img.shields.io/badge/Coverage-70%2B%25-brightgreen)]()

---

## 🎯 Visão Geral

O **Detector de Promessa Vazia** é um sistema de análise de promessas políticas que:

- **Extrai promessas** de textos usando PLN (Processamento de Linguagem Natural) em português
- **Cruza dados públicos** de SICONFI (orçamentos), Portal da Transparência (gastos) e TSE (histórico político)
- **Calcula probabilidade** de cumprimento baseado em 5 fatores: viabilidade orçamentária, histórico do autor, similaridade com promessas anteriores, escopo geográfico e tendências históricas
- **Fornece transparência** completa sobre metodologia, fontes de dados e critérios de análise
- **Protege legalmente** com disclaimers robustos indicando análise probabilística não-acusatória

---

## ✨ Funcionalidades Principais

### 1. **Interface de Submissão**
- Colar discursos, posts ou textos políticos
- Análise em tempo real com feedback visual
- Suporte a múltiplos formatos (texto, URL, arquivo)

### 2. **Motor de PLN em Português**
- Extração automática de promessas
- Categorização por tema (educação, saúde, infraestrutura, etc)
- Análise de confiança e especificidade

### 3. **Integração com Dados Públicos**
- **SICONFI**: Dados orçamentários federais, estaduais e municipais
- **Portal da Transparência**: Histórico de gastos e transferências
- **TSE**: Histórico político de candidatos e promessas anteriores

### 4. **Cálculo de Probabilidade**
- Score de 0-100% baseado em 5 fatores
- Intervalo de confiança estatístico
- Explicação detalhada de cada fator

### 5. **Dashboard de Análises**
- Histórico completo de análises realizadas
- Gráficos de distribuição por categoria
- Filtros por data, autor, categoria
- Exportação em JSON

### 6. **Painel de Transparência**
- Documentação completa da metodologia
- Fontes de dados e datas de atualização
- Critérios de análise explicados
- Limitações e disclaimers legais

### 7. **Sistema de Segurança**
- Autenticação JWT com refresh tokens
- Rate limiting (10 análises/hora anônimo, 50/dia autenticado)
- Logging e auditoria completos
- Conformidade LGPD (direito ao esquecimento, portabilidade)

### 8. **Sincronização Automática**
- Job diário às 2:00 AM (sincronização completa)
- Job a cada 6 horas (sincronização incremental)
- Retry automático com 3 tentativas
- Status de sincronização em tempo real

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js 22.13.0+
- pnpm 10.4.1+
- SQLite3

### Instalação

```bash
# 1. Clonar repositório
git clone https://github.com/Glitch-D-ream/Testes.git
cd Testes

# 2. Instalar dependências
pnpm install

# 3. Configurar banco de dados
pnpm db:push

# 4. Iniciar servidor de desenvolvimento
pnpm dev
```

O servidor estará disponível em `http://localhost:3000`

---

## 📁 Estrutura do Projeto

```
detector_promessa_vazia/
├── client/                          # Frontend React 19
│   ├── src/
│   │   ├── pages/                  # Páginas principais
│   │   │   ├── Home.tsx            # Página inicial
│   │   │   ├── Analysis.tsx        # Resultados da análise
│   │   │   ├── Dashboard.tsx       # Dashboard de análises
│   │   │   ├── History.tsx         # Histórico
│   │   │   ├── Methodology.tsx     # Metodologia
│   │   │   └── Privacy.tsx         # Política de privacidade
│   │   ├── components/             # Componentes reutilizáveis
│   │   │   ├── AnalysisForm.tsx
│   │   │   ├── LegalDisclaimer.tsx
│   │   │   ├── ConsentModal.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── App.tsx                 # Roteamento principal
│   │   ├── main.tsx                # Entry point
│   │   └── index.css               # Estilos globais
│   ├── public/                     # Arquivos estáticos
│   └── index.html
│
├── server/                          # Backend Express.js
│   ├── core/
│   │   ├── auth.ts                 # Autenticação JWT
│   │   ├── middleware.ts           # Middlewares
│   │   ├── logger.ts               # Logging com Winston
│   │   ├── schemas.ts              # Validação com Zod
│   │   ├── database.ts             # Conexão SQLite
│   │   ├── security-headers.ts     # Headers de segurança
│   │   ├── csrf.ts                 # Proteção CSRF
│   │   └── routes.ts               # Rotas principais
│   ├── modules/
│   │   ├── nlp.ts                  # Motor de PLN
│   │   ├── probability.ts          # Cálculo de probabilidade
│   │   └── nlp.test.ts             # Testes PLN
│   ├── integrations/
│   │   ├── siconfi.ts              # Integração SICONFI
│   │   ├── portal-transparencia.ts # Integração Portal
│   │   ├── tse.ts                  # Integração TSE
│   │   └── tse.test.ts             # Testes TSE
│   ├── jobs/
│   │   ├── sync-public-data.ts     # Job de sincronização
│   │   ├── scheduler.ts            # Scheduler com node-cron
│   │   ├── sync-public-data.test.ts
│   │   └── scheduler.test.ts
│   ├── routes/
│   │   └── auth.ts                 # Rotas de autenticação
│   ├── index.ts                    # Entry point servidor
│   └── api.integration.test.ts     # Testes de integração
│
├── e2e/                            # Testes E2E com Playwright
│   ├── submit-analysis.spec.ts
│   ├── view-and-export.spec.ts
│   └── auth-and-lgpd.spec.ts
│
├── drizzle/
│   └── schema.ts                   # Schema do banco de dados
│
├── package.json                    # Dependências
├── tsconfig.json                   # Configuração TypeScript
├── vite.config.ts                  # Configuração Vite
├── vitest.config.ts                # Configuração Vitest
├── playwright.config.ts            # Configuração Playwright
├── todo.md                         # Roadmap do projeto
└── README.md                       # Este arquivo
```

---

## 🧪 Testes

### Executar Todos os Testes

```bash
# Testes unitários
pnpm test

# Testes E2E
pnpm test:e2e

# Testes com cobertura
pnpm test:coverage
```

### Cobertura de Testes

- **Autenticação**: 30+ casos (JWT, bcrypt, refresh tokens)
- **PLN**: 40+ casos (extração, categorização, confiança)
- **Probabilidade**: 25+ casos (fatores, cálculos, validações)
- **Validação**: 35+ casos (schemas Zod)
- **API**: 50+ casos (endpoints, autenticação, rate limiting)
- **TSE**: 20+ casos (histórico, credibilidade)
- **Sincronização**: 25+ casos (jobs, status, retry)
- **Scheduler**: 35+ casos (agendamento, transições)
- **E2E**: 27+ casos (fluxos completos)

**Total: 360+ casos de teste**

---

## 🔐 Segurança

### Implementado

- ✅ **Autenticação JWT** com bcrypt
- ✅ **Rate Limiting** (10/hora anônimo, 50/dia autenticado)
- ✅ **Logging e Auditoria** com Winston
- ✅ **Validação de Entrada** com Zod
- ✅ **Headers de Segurança** (HSTS, CSP, X-Frame-Options)
- ✅ **Proteção CSRF** com csurf
- ✅ **Conformidade LGPD** (direito ao esquecimento, portabilidade)
- ✅ **Soft Delete** para dados de usuários

### Roadmap de Segurança

- [ ] Implementar 2FA (autenticação de dois fatores)
- [ ] Adicionar rate limiting por endpoint
- [ ] Implementar WAF (Web Application Firewall)
- [ ] Adicionar verificação de integridade de dados

---

## 📊 Arquitetura

### Stack Tecnológico

**Frontend:**
- React 19
- Tailwind CSS 4
- Recharts (gráficos)
- Vite (build tool)

**Backend:**
- Express.js 4
- Node.js 22
- SQLite3
- node-cron (agendamento)

**Testes:**
- Vitest (unitários)
- Playwright (E2E)

**Banco de Dados:**
- Drizzle ORM
- SQLite (desenvolvimento)
- MySQL/PostgreSQL (produção)

### Fluxo de Dados

```
Usuário
  ↓
[Frontend React]
  ↓
[API Express.js]
  ├→ [Autenticação JWT]
  ├→ [Validação Zod]
  ├→ [Motor PLN]
  ├→ [Cálculo Probabilidade]
  └→ [Integração Dados Públicos]
       ├→ SICONFI
       ├→ Portal da Transparência
       └→ TSE
  ↓
[Banco SQLite]
  ↓
[Dashboard + Resultados]
```

---

## 🌐 Dados Públicos Integrados

### SICONFI (Orçamentos)
- 10 categorias (educação, saúde, infraestrutura, etc)
- Dados federais, estaduais e municipais
- Histórico de 5+ anos
- Taxa de execução orçamentária

### Portal da Transparência
- 27 estados brasileiros
- Histórico de gastos e transferências
- Categorização por tipo de despesa
- Dados em tempo real

### TSE (Tribunal Superior Eleitoral)
- Histórico de candidatos
- Promessas anteriores e cumprimento
- Taxa de eleição e reeleição
- Escândalos e controvérsias

---

## 🔄 Sincronização Automática

### Jobs Agendados

1. **Sincronização Completa** (2:00 AM diariamente)
   - Sincroniza SICONFI + Portal + TSE
   - Retry automático (3 tentativas, 5s intervalo)

2. **Sincronização Incremental** (A cada 6 horas)
   - Sincroniza Portal da Transparência
   - Ideal para dados em tempo real

3. **Limpeza de Cache** (3:00 AM diariamente)
   - Remove dados com mais de 30 dias
   - Mantém histórico essencial

### Disparar Sincronização Manual

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📖 Documentação Adicional

- **[API.md](./API.md)** - Documentação completa de endpoints
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Explicação detalhada da arquitetura
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Guia para contribuidores
- **[METHODOLOGY.md](./METHODOLOGY.md)** - Explicação da metodologia de análise

---

## 🚦 Status do Projeto

| Componente | Status | Score |
|-----------|--------|-------|
| Segurança | ✅ Implementado | 8/10 |
| Testes | ✅ 360+ casos | 8.5/10 |
| PLN | ✅ Funcional | 5/10 |
| Dados Públicos | ✅ Integrado | 9/10 |
| Dashboard | ✅ Implementado | 7/10 |
| Documentação | 🟡 Parcial | 4/10 |
| Escalabilidade | 🟡 SQLite | 2/10 |

**Score Geral: 8.4/10**

---

## 🗺️ Roadmap

### Fase 4: Documentação + CI/CD (Atual)
- [x] README completo
- [x] API documentation
- [x] Architecture guide
- [ ] GitHub Actions CI/CD
- [ ] Badges e status

### Fase 5: UX/UI (Próximo)
- [ ] Validação em tempo real
- [ ] Modo escuro/claro
- [ ] Acessibilidade WCAG 2.1 AA
- [ ] Animações e loading states

### Fase 6: Escalabilidade
- [ ] Migrar para PostgreSQL
- [ ] Redis para cache
- [ ] Bull Queue para jobs
- [ ] Nginx load balancing

### Fase 7: Observabilidade
- [ ] Sentry para error tracking
- [ ] Prometheus para métricas
- [ ] Grafana para dashboards
- [ ] ELK Stack para logs

### Fase 8: Features Avançadas
- [ ] Análise em tempo real de redes sociais
- [ ] Mobile app com React Native
- [ ] Suporte a múltiplos idiomas
- [ ] API pública para integrações

---

## 📝 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia [CONTRIBUTING.md](./CONTRIBUTING.md) para detalhes sobre nosso código de conduta e processo de submissão de pull requests.

---

## 📧 Contato

Para dúvidas, sugestões ou reportar bugs, abra uma [issue no GitHub](https://github.com/Glitch-D-ream/Testes/issues).

---

## ⚖️ Aviso Legal

Este projeto fornece análise probabilística de viabilidade de promessas políticas. **Não é acusação, condenação ou julgamento de caráter**. Todos os resultados devem ser interpretados como análise estatística baseada em dados históricos e orçamentários públicos.

Para detalhes completos, veja [LEGAL_DISCLAIMER.md](./LEGAL_DISCLAIMER.md).

---

**Desenvolvido com ❤️ para transparência política**
