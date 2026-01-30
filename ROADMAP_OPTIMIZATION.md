# 🚀 Roadmap de Otimização de Performance e Resiliência - Seth VII

Este documento detalha o plano estratégico para resolver os problemas de latência extrema, timeouts e dados incompletos no deploy de produção (Railway).

## 📋 1. Diagnóstico de Problemas Atuais
- **Saturação de CPU:** O processo principal do Express executa auditorias pesadas (Scraping + IA), bloqueando o Event Loop.
- **Timeouts de Rede:** Requisições HTTP síncronas excedem o limite de 30s do Railway/Browser.
- **Consumo de RAM:** O uso indiscriminado do Playwright causa OOM (Out of Memory) em instâncias pequenas.
- **Instabilidade de IA:** Dependência de fallbacks gratuitos instáveis sem tratamento de erro robusto.

---

## 🏗️ 2. Fase 1: Arquitetura de Workers (Assincronismo)
**Objetivo:** Transformar a auditoria em um processo de background.
- [x] **Refatoração do `AnalysisWorker`:** Criar um worker dedicado que consome a `analysisQueue`.
- [x] **Desacoplamento do `SearchService`:** O endpoint de busca agora apenas registra o pedido e retorna um `analysisId` instantaneamente.
- [ ] **Monitoramento de Filas:** Implementar logs específicos para o ciclo de vida dos jobs (Active, Completed, Failed).

---

## 🚀 3. Fase 2: Otimização de Ingestão (Economia de Recursos)
**Objetivo:** Reduzir o uso de memória e CPU em 50%.
- [x] **Estratégia Lite-First:** Modificar o `IngestionService` para usar `axios` + `cheerio` por padrão.
- [x] **Playwright sob Demanda:** Acionar o navegador apenas quando o HTML simples falhar ou for detectado um SPA.
- [x] **Pool de Navegadores:** Limitar o número de instâncias simultâneas do Chromium para evitar crash do servidor. (Limite: 1 em produção)

---
## 💾 4. Fase 3: Persistência de Estados e Polling
**Objetivo:** Eliminar o "carregamento infinito" e fornecer feedback em tempo real.
- [x] **Granularidade de Status:** Atualizar a coluna `progress` no Supabase em cada etapa (Scout, Filter, Brain, Consensus).
- [x] **Logs de Auditoria:** Salvar erros específicos na coluna `error_message` para que o usuário saiba por que uma análise falhou.
- [ ] **Recuperação de Falhas:** Implementar lógica para que o Worker retome jobs interrompidos por reinicialização do servidor.

---

## 🧪 5. Fase 4: Validação e Infraestrutura
**Objetivo:** Garantir estabilidade no ambiente Railway.
- [ ] **Configuração de Recursos:** Ajustar `railway.json` para garantir limites adequados de memória.
- [ ] **Health Checks:** Melhorar o `/api/health` para monitorar a saúde do Redis e a latência das APIs de IA.
- [ ] **Stress Test:** Validar o comportamento do sistema sob carga de 5 análises simultâneas.

---

## 📅 Cronograma de Execução
1. **Dia 1:** Finalização da Fase 1 (Workers) e Fase 2 (Ingestion). (CONCLUÍDO)
2. **Dia 2:** Implementação da Fase 3 (Persistência) e Testes de Integração. (CONCLUÍDO)
3. **Dia 3:** Deploy em Produção e Monitoramento de Logs.

---

*Documento atualizado por **Seth VII** em 30/01/2026.*
