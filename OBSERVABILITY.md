# Observabilidade - Sentry + Prometheus + Grafana

Este documento descreve o sistema de observabilidade do Detector de Promessa Vazia, incluindo error tracking, métricas e health checks.

## 📊 Componentes

### 1. Sentry (Error Tracking)

**Propósito:** Rastrear erros em produção automaticamente

**Configuração:**
```typescript
import { initializeSentry } from './server/core/observability';

// Inicializar Sentry
initializeSentry(process.env.SENTRY_DSN);
```

**Variáveis de Ambiente:**
- `SENTRY_DSN` - Data Source Name do Sentry

**Funcionalidades:**
- Captura automática de exceções não tratadas
- Rastreamento de rejeições de promessas
- Contexto de requisições HTTP
- Rastreamento de transações

**Exemplo de Uso:**
```typescript
import { captureException, captureMessage } from './server/core/observability';

try {
  // código
} catch (error) {
  captureException(error, { context: 'analysis' });
}

// Capturar mensagem
captureMessage('Analysis completed', 'info');
```

### 2. Prometheus (Métricas)

**Propósito:** Coletar métricas de performance e negócio

**Métricas Disponíveis:**

#### Métricas HTTP
- `http_request_duration_seconds` - Duração das requisições
- `http_requests_total` - Total de requisições
- `http_request_size_bytes` - Tamanho das requisições
- `http_response_size_bytes` - Tamanho das respostas

#### Métricas de Análise
- `analysis_total` - Total de análises (por tipo e status)
- `analysis_promise_count` - Número de promessas detectadas
- `analysis_confidence` - Score de confiança
- `analysis_processing_time_seconds` - Tempo de processamento

#### Métricas de Banco de Dados
- `database_query_duration_seconds` - Duração de queries
- `database_queries_total` - Total de queries

#### Métricas de Cache
- `cache_hits_total` - Acertos de cache
- `cache_misses_total` - Falhas de cache
- `cache_size_bytes` - Tamanho do cache

#### Métricas de Sistema
- `system_uptime_seconds` - Tempo de atividade
- `system_memory_usage_bytes` - Uso de memória (heap, external, RSS)
- `system_cpu_usage_percent` - Uso de CPU
- `active_connections` - Conexões ativas

**Endpoint:**
```
GET /metrics
```

**Formato:** Prometheus text format (v0.0.4)

**Exemplo:**
```bash
curl http://localhost:3000/metrics
```

### 3. Health Checks

**Propósito:** Verificar saúde da aplicação

#### Endpoint Principal
```
GET /health
```

**Response:**
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2026-01-21T17:40:00Z",
  "uptime": 1234.56,
  "checks": {
    "memory": {
      "status": "ok|warning|error",
      "message": "Heap usage: 45.23%",
      "details": {
        "heapUsed": 123456789,
        "heapTotal": 987654321,
        "external": 12345,
        "rss": 1234567890
      }
    },
    "database": {
      "status": "ok",
      "message": "Database connection OK"
    },
    "api": {
      "status": "ok",
      "message": "API responding"
    }
  }
}
```

#### Liveness Probe
```
GET /health/live
```

Retorna 200 se o serviço está rodando.

#### Readiness Probe
```
GET /health/ready
```

Retorna 200 se o serviço está pronto para receber requisições.

#### Version Info
```
GET /version
```

**Response:**
```json
{
  "version": "1.0.0",
  "buildTime": "2026-01-21T17:40:00Z",
  "environment": "production",
  "nodeVersion": "v22.13.0",
  "uptime": 1234.56
}
```

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Sentry
SENTRY_DSN=https://key@sentry.io/project-id

# Prometheus (opcional)
PROMETHEUS_ENABLED=true

# Node.js
NODE_ENV=production
```

### Integração com Express

```typescript
import express from 'express';
import {
  initializeSentry,
  requestTracingMiddleware,
  errorTrackingMiddleware,
  startMetricsCollection,
} from './server/core/observability';
import observabilityRouter from './server/routes/observability';

const app = express();

// Inicializar Sentry
initializeSentry(process.env.SENTRY_DSN);

// Middleware de tracing
app.use(requestTracingMiddleware);

// Rotas de observabilidade
app.use('/', observabilityRouter);

// Middleware de erro (deve ser último)
app.use(errorTrackingMiddleware);

// Iniciar coleta de métricas
startMetricsCollection();

app.listen(3000);
```

## 📈 Integração com Grafana

### Passo 1: Adicionar Data Source Prometheus

1. Abrir Grafana (http://localhost:3000)
2. Ir para Configuration → Data Sources
3. Clique em "Add data source"
4. Selecione "Prometheus"
5. Configure URL: `http://localhost:9090` (ou seu Prometheus)
6. Clique em "Save & Test"

### Passo 2: Criar Dashboard

1. Clique em "+" → Dashboard
2. Clique em "Add new panel"
3. Selecione Prometheus como data source
4. Escreva query Prometheus:

```promql
# Taxa de requisições por segundo
rate(http_requests_total[1m])

# Latência P95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Taxa de análises
rate(analysis_total[1m])

# Uso de memória
system_memory_usage_bytes{type="heap_used"} / 1024 / 1024
```

### Passo 3: Configurar Alertas

```yaml
groups:
  - name: detector_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "Taxa de erro alta"

      - alert: HighMemoryUsage
        expr: (system_memory_usage_bytes{type="heap_used"} / system_memory_usage_bytes{type="heap_total"}) > 0.9
        for: 5m
        annotations:
          summary: "Uso de memória acima de 90%"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        annotations:
          summary: "Latência P95 acima de 1s"
```

## 🚀 Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      SENTRY_DSN: ${SENTRY_DSN}
      NODE_ENV: production
    depends_on:
      - prometheus

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    depends_on:
      - prometheus
```

### prometheus.yml

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'detector'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

## 📊 Queries Prometheus Úteis

```promql
# Taxa de requisições por segundo
rate(http_requests_total[1m])

# Latência média
avg(rate(http_request_duration_seconds_sum[5m])) / avg(rate(http_request_duration_seconds_count[5m]))

# Latência P50, P95, P99
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Taxa de erro
rate(http_requests_total{status_code=~"5.."}[5m])

# Taxa de análises bem-sucedidas
rate(analysis_total{status="success"}[5m])

# Taxa de análises com erro
rate(analysis_total{status="error"}[5m])

# Uso de memória em MB
system_memory_usage_bytes{type="heap_used"} / 1024 / 1024

# Percentual de memória heap usada
(system_memory_usage_bytes{type="heap_used"} / system_memory_usage_bytes{type="heap_total"}) * 100

# Uptime
system_uptime_seconds

# Conexões ativas
active_connections
```

## 🔍 Troubleshooting

### Sentry não está capturando erros

1. Verifique se `SENTRY_DSN` está configurado
2. Verifique se `initializeSentry()` foi chamado
3. Verifique os logs do servidor

### Prometheus não está coletando métricas

1. Verifique se `/metrics` está acessível
2. Verifique a configuração do `prometheus.yml`
3. Verifique se `startMetricsCollection()` foi chamado

### Health check retorna "unhealthy"

1. Verifique uso de memória (`/health`)
2. Verifique logs de erro
3. Verifique se banco de dados está acessível

## 📚 Referências

- [Sentry Documentation](https://docs.sentry.io/platforms/node/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [OpenMetrics Format](https://openmetrics.io/)
