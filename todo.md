# Detector de Promessa Vazia - Roadmap de Melhorias

## FASE 1: SEGURANÇA E CONFORMIDADE (Crítico - 3-4 semanas)

### 1.1 Autenticação e Autorização
- [x] Criar módulo de autenticação JWT (server/core/auth.ts)
- [x] Implementar hash de senha com bcrypt
- [x] Adicionar tabela de usuários no banco
- [x] Criar middleware de autenticação
- [x] Implementar rotas de login/registro
- [x] Adicionar refresh tokens
- [x] Implementar controle de acesso baseado em roles (user, analyst, admin)

### 1.2 Rate Limiting
- [x] Instalar express-rate-limit
- [x] Implementar rate limiting por IP (10 análises/hora)
- [x] Implementar rate limiting por usuário (50 análises/dia)
- [x] Configurar limites específicos por rota

### 1.3 Logging e Auditoria
- [x] Criar módulo de logging com Winston (server/core/logger.ts)
- [x] Adicionar tabela de audit_logs
- [x] Implementar logging de ações de usuários
- [x] Configurar rotação de logs

### 1.4 Conformidade LGPD
- [ ] Criar página de política de privacidade (client/src/pages/Privacy.tsx)
- [ ] Adicionar modal de consentimento
- [x] Implementar direito ao esquecimento (DELETE /api/user/data)
- [x] Adicionar endpoint de exportação de dados (GET /api/user/data/export)
- [x] Criar tabela de consentimentos

### 1.5 Validação de Entrada
- [x] Instalar Zod para validação
- [x] Criar schemas de validação (server/core/schemas.ts)
- [ ] Implementar sanitização de output
- [ ] Adicionar proteção CSRF

### 1.6 Headers de Segurança
- [x] Adicionar headers HTTP de segurança (server/core/security-headers.ts)
- [x] Configurar Content Security Policy
- [x] Implementar proteção CSRF (server/core/csrf.ts)
- [ ] Configurar HTTPS em produção

### 1.7 UI de Consentimento LGPD
- [x] Criar componente ConsentModal (client/src/components/ConsentModal.tsx)
- [x] Criar página de Política de Privacidade (client/src/pages/Privacy.tsx)
- [ ] Integrar modal no fluxo de registro
- [ ] Adicionar rota /privacy
- [ ] Criar página de configurações de consentimento

## FASE 2: TESTES AUTOMATIZADOS (Crítico - 3-4 semanas)

### 2.1 Testes Unitários
- [x] Configurar Vitest (vitest.config.ts)
- [x] Testes do motor de PLN (server/modules/nlp.test.ts) - 40+ casos
- [x] Testes do algoritmo de probabilidade (server/modules/probability.test.ts) - 25+ casos
- [x] Testes de autenticação (server/core/auth.test.ts) - 30+ casos
- [x] Testes de validação (server/core/schemas.test.ts) - 35+ casos
- [ ] Testes do banco de dados (server/core/database.test.ts)
- [ ] Atingir 70%+ cobertura

### 2.2 Testes de Integração
- [x] Testes de API completos (server/api.integration.test.ts) - 50+ casos
- [ ] Testes de fluxo de usuário
- [ ] Testes de autenticação e autorização

### 2.3 Testes E2E
- [x] Configurar Playwright (playwright.config.ts)
- [x] Testes de submissão de análise (e2e/submit-analysis.spec.ts) - 7 casos
- [x] Testes de visualização de resultado (e2e/view-and-export.spec.ts) - 9 casos
- [x] Testes de histórico e filtros
- [x] Testes de autenticação e LGPD (e2e/auth-and-lgpd.spec.ts) - 11 casos

### 2.4 Testes de Carga
- [x] Configurar k6 (k6/load-test.js)
  - Load test: 100 usuários, 24 min
  - Stress test: 500 usuários, 30 min
  - Spike test: picos de 200 usuários
- [x] Teste com 100 usuários simultâneos (load-test.js)
- [x] Teste com 500 usuários (stress-test.js)
- [x] Teste de spike (spike-test.js)
- [x] Documentação k6 (k6/README.md)

### 2.5 Linting e Formatação
- [ ] Configurar ESLint (.eslintrc.json)
- [ ] Configurar Prettier (.prettierrc.json)
- [ ] Integrar em pre-commit hooks (.husky/pre-commit)

## FASE 3: PLN E DADOS PÚBLICOS (Alto - 4-6 semanas)

### 3.1 Melhorar Motor de PLN
- [ ] Integrar biblioteca NLP (natural ou compromise)
- [ ] Adicionar análise de negações ("não vou...")
- [ ] Adicionar análise de condições ("se eleito...")
- [ ] Adicionar análise de escopo geográfico
- [ ] Adicionar análise de similaridade entre promessas
- [ ] Adicionar detecção de conflitos

### 3.2 Integrar Dados Públicos
- [x] Integrar API SICONFI (server/integrations/siconfi.ts)
- [x] Integrar API Portal da Transparência (server/integrations/portal-transparencia.ts)
- [x] Integrar dados TSE (server/integrations/tse.ts)
  - getCandidateInfo()
  - getCandidatePromiseHistory()
  - getPoliticalHistory()
  - validateCandidateCredibility()
  - syncTSEData()
- [x] Implementar sincronização periódica (jobs/sync-public-data.ts)
  - syncAllPublicData()
  - syncWithRetry()
  - getSyncStatus()
  - initializeSyncSystem()
- [x] Criar tabelas de dados públicos no banco (schema em database-schema-cache.ts)
- [x] Agendar job com node-cron (server/jobs/scheduler.ts)
  - Sincronização completa: 2:00 AM diariamente
  - Sincronização incremental: A cada 6 horas
  - Limpeza de cache: 3:00 AM diariamente
  - Testes: 35+ casos (server/jobs/scheduler.test.ts)

### 3.3 Testes de Integração com Dados Públicos
- [x] Testes para TSE (server/integrations/tse.test.ts) - 20+ casos
- [x] Testes para job de sincronização (server/jobs/sync-public-data.test.ts) - 25+ casos
- [ ] Testes de integração completa (SICONFI + Portal + TSE)
- [ ] Validar modelo contra dados reais
- [ ] Coletar 100+ casos históricos para validação
- [ ] Ajustar pesos dos fatores
- [ ] Adicionar intervalo de confiança

## FASE 4: DOCUMENTAÇÃO E CI/CD (Completo - 2-3 semanas)

### 4.1 Documentação
- [x] Criar README.md completo (README.md)
- [x] Criar API.md com endpoints (API.md)
- [x] Criar ARCHITECTURE.md (ARCHITECTURE.md)
- [x] Criar CONTRIBUTING.md (CONTRIBUTING.md)
- [x] Criar guia de deployment (DEPLOYMENT.md)
  - Railway
  - Render
  - VPS (DigitalOcean, Linode, AWS)
  - Docker
  - Monitoramento
- [x] Criar Dockerfile (Dockerfile)
- [x] Criar docker-compose.yml (docker-compose.yml)
- [x] Criar nginx.conf (nginx.conf)
- [ ] Criar guia de desenvolvimento (DEVELOPMENT.md)

### 4.2 CI/CD
- [x] Configurar GitHub Actions (.github/workflows/ci.yml)
- [x] Workflow de testes (unit + E2E)
- [x] Workflow de linting
- [x] Workflow de build
- [x] Workflow de security scanning (Trivy)
- [x] Workflow de deploy automático
- [ ] Adicionar badges ao README
- [ ] Configurar Codecov para cobertura

## FASE 5: UX/UI (Médio - 2-3 semanas)

### 5.1 Melhorias de Interface
- [ ] Adicionar validação em tempo real
- [ ] Adicionar modo escuro
- [ ] Melhorar responsividade mobile
- [ ] Adicionar acessibilidade (WCAG 2.1 AA)
- [ ] Adicionar visualizações gráficas

### 5.2 Novas Funcionalidades
- [ ] Criar dashboard com estatísticas (client/src/pages/Dashboard.tsx)
- [ ] Adicionar busca avançada
- [ ] Adicionar comparação de análises
- [ ] Adicionar exportação em múltiplos formatos (PDF, CSV, Excel)
- [ ] Adicionar compartilhamento de análises

## FASE 6: ESCALABILIDADE (Médio - 3-4 semanas)

### 6.1 Banco de Dados
- [ ] Migrar para PostgreSQL
- [ ] Adicionar índices de performance
- [ ] Configurar replicação

### 6.2 Cache e Fila
- [ ] Integrar Redis (server/core/cache.ts)
- [ ] Implementar cache de análises
- [ ] Implementar Bull Queue (server/core/queue.ts)
- [ ] Criar workers assincronos

### 6.3 Infraestrutura
- [ ] Configurar Nginx load balancer (nginx.conf)
- [ ] Containerizar com Docker (Dockerfile)
- [ ] Criar docker-compose.yml

## FASE 7: OBSERVABILIDADE (Médio - 2-3 semanas)

### 7.1 Monitoramento
- [ ] Integrar Sentry (server/core/sentry.ts)
- [ ] Integrar Prometheus (server/core/metrics.ts)
- [ ] Integrar Grafana
- [ ] Integrar ELK Stack

### 7.2 Alertas
- [ ] Configurar alertas automáticos
- [ ] Integrar com Slack

## FASE 8: FEATURES AVANÇADAS (Baixo - 4-6 semanas)

### 8.1 Análise em Tempo Real
- [ ] Integração com redes sociais (Twitter, Instagram, Facebook)
- [ ] Análise de campanhas

### 8.2 Mobile App
- [ ] Criar app com React Native

### 8.3 Expansão de Idiomas
- [ ] Adicionar suporte a espanhol
- [ ] Adicionar suporte a inglês

---

## FEATURES ORIGINAIS (Completadas)

- [x] Interface para submissão de discursos
- [x] Motor de PLN básico (regex)
- [x] Sistema de cruzamento manual com dados
- [x] Cálculo de probabilidade
- [x] Painel de transparência metodológica
- [x] Sistema de disclaimers legais
- [x] Histórico de análises
- [x] Visualização de dados (básica)
- [x] Sistema de cache local
- [x] Documentação de metodologia
