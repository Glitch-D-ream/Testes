# Testes de Carga com k6

> **Detector de Promessa Vazia - Performance Testing**

Testes de carga, stress e spike para validar performance da aplicação.

---

## 📋 Índice

1. [Instalação](#instalação)
2. [Testes Disponíveis](#testes-disponíveis)
3. [Como Executar](#como-executar)
4. [Interpretando Resultados](#interpretando-resultados)
5. [Benchmarks](#benchmarks)

---

## 🔧 Instalação

### macOS

```bash
brew install k6
```

### Linux

```bash
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3232A
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Windows

```bash
choco install k6
```

### Docker

```bash
docker run -i grafana/k6 run - < k6/load-test.js
```

---

## 🧪 Testes Disponíveis

### 1. Load Test (load-test.js)

**Objetivo:** Validar performance com carga normal

**Perfil:**
- 0 → 10 usuários (2 min)
- 10 → 50 usuários (5 min)
- 50 → 100 usuários (10 min)
- 100 → 50 usuários (5 min)
- 50 → 0 usuários (2 min)

**Duração Total:** 24 minutos

**Cenários:**
- Submissão de análise
- Obtenção de análise
- Exportação de análise
- Listagem de análises
- Dashboard

**Thresholds:**
- P95 < 500ms
- P99 < 1000ms
- Taxa de erro < 10%

---

### 2. Stress Test (stress-test.js)

**Objetivo:** Encontrar limite de performance

**Perfil:**
- 0 → 100 usuários (2 min)
- 100 → 200 usuários (5 min)
- 200 → 300 usuários (5 min)
- 300 → 400 usuários (5 min)
- 400 → 500 usuários (5 min)
- 500 → 300 usuários (5 min)
- 300 → 0 usuários (3 min)

**Duração Total:** 30 minutos

**Cenários:**
- Submissão intensiva
- Leitura sob stress
- Sincronização

**Thresholds:**
- P95 < 1000ms
- P99 < 2000ms
- Taxa de erro < 20%

---

### 3. Spike Test (spike-test.js)

**Objetivo:** Simular picos de tráfego

**Perfil:**
- Baseline: 10 usuários
- Spike 1: 10 → 100 usuários (1 min)
- Manter: 100 usuários (3 min)
- Recuperação: 100 → 10 usuários (1 min)
- Spike 2: 10 → 200 usuários (1 min)
- Manter: 200 usuários (3 min)
- Recuperação: 200 → 0 usuários (3 min)

**Duração Total:** 15 minutos

**Thresholds:**
- P95 < 2000ms
- P99 < 5000ms
- Taxa de erro < 30%

---

## ▶️ Como Executar

### Setup Inicial

```bash
# 1. Iniciar aplicação localmente
pnpm dev

# 2. Criar usuário de teste (em outro terminal)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "loadtest@example.com",
    "password": "LoadTest123!",
    "name": "Load Test User",
    "consentLGPD": true
  }'

# 3. Fazer login e obter token
RESPONSE=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "loadtest@example.com",
    "password": "LoadTest123!"
  }')

TOKEN=$(echo $RESPONSE | jq -r '.token')
echo "Token: $TOKEN"
```

### Executar Load Test

```bash
# Modo básico
k6 run k6/load-test.js

# Com token de autenticação
k6 run k6/load-test.js \
  --env BASE_URL=http://localhost:3000 \
  --env AUTH_TOKEN=$TOKEN

# Com saída detalhada
k6 run k6/load-test.js \
  --env AUTH_TOKEN=$TOKEN \
  -v

# Com relatório HTML
k6 run k6/load-test.js \
  --env AUTH_TOKEN=$TOKEN \
  --out json=k6-report.json
```

### Executar Stress Test

```bash
k6 run k6/stress-test.js \
  --env AUTH_TOKEN=$TOKEN \
  -v
```

### Executar Spike Test

```bash
k6 run k6/spike-test.js \
  --env AUTH_TOKEN=$TOKEN \
  -v
```

### Executar Todos os Testes

```bash
#!/bin/bash

echo "=== Load Test ==="
k6 run k6/load-test.js --env AUTH_TOKEN=$TOKEN

echo -e "\n=== Stress Test ==="
k6 run k6/stress-test.js --env AUTH_TOKEN=$TOKEN

echo -e "\n=== Spike Test ==="
k6 run k6/spike-test.js --env AUTH_TOKEN=$TOKEN
```

---

## 📊 Interpretando Resultados

### Métricas Principais

**http_reqs**
- Total de requisições feitas
- Taxa média (req/s)

**http_req_duration**
- Tempo de resposta em ms
- Avg: Média
- Min: Mínimo
- Max: Máximo
- P95: 95º percentil (95% das requisições foram mais rápidas)
- P99: 99º percentil (99% das requisições foram mais rápidas)

**http_req_failed**
- Taxa de requisições que falharam
- Deve ser < 10% em load test

**vus**
- Virtual Users (usuários simultâneos)
- Max: Máximo atingido

### Exemplo de Saída

```
     data_received..................: 5.2 MB   18 kB/s
     data_sent.......................: 3.1 MB   10 kB/s
     http_req_blocked................: avg=1.23ms   min=0s       max=45ms    p(90)=2ms     p(95)=3ms     p(99)=10ms
     http_req_connecting.............: avg=0.45ms   min=0s       max=15ms    p(90)=0s      p(95)=1ms     p(99)=5ms
     http_req_duration..............: avg=245ms    min=50ms     max=1.2s    p(90)=350ms   p(95)=450ms   p(99)=800ms
     http_req_failed.................: 2.5%
     http_req_receiving.............: avg=12ms     min=1ms      max=150ms   p(90)=20ms    p(95)=30ms    p(99)=50ms
     http_req_sending...............: avg=5ms      min=0s       max=50ms    p(90)=8ms     p(95)=10ms    p(99)=20ms
     http_req_tls_handshaking.......: avg=0s       min=0s       max=0s      p(90)=0s      p(95)=0s      p(99)=0s
     http_req_waiting...............: avg=228ms    min=40ms     max=1.1s    p(90)=330ms   p(95)=420ms   p(99)=750ms
     http_reqs.......................: 1500      5.0/s
     iteration_duration..............: avg=3.5s    min=2.1s    max=8.2s    p(90)=4.2s    p(95)=5.1s    p(99)=6.8s
     iterations......................: 300       1.0/s
     vus............................: 50        min=0      max=100
     vus_max.........................: 100
```

### Interpretação

✅ **Bom:**
- P95 < 500ms
- P99 < 1000ms
- Taxa de erro < 5%

⚠️ **Aceitável:**
- P95 < 1000ms
- P99 < 2000ms
- Taxa de erro < 10%

❌ **Ruim:**
- P95 > 1000ms
- P99 > 2000ms
- Taxa de erro > 10%

---

## 📈 Benchmarks

### Esperado para Detector de Promessa Vazia

| Métrica | Esperado | Limite |
|---------|----------|--------|
| P95 | < 500ms | < 1000ms |
| P99 | < 1000ms | < 2000ms |
| Taxa Erro | < 5% | < 10% |
| Max VUs | 100+ | 50+ |
| Req/s | 10+ | 5+ |

### Otimizações Recomendadas

Se os resultados forem piores que o esperado:

1. **Aumentar recursos do servidor**
   - CPU: 2+ vCPU
   - RAM: 4+ GB
   - SSD: 50+ GB

2. **Otimizar banco de dados**
   - Adicionar índices
   - Usar connection pooling
   - Implementar caching

3. **Implementar cache**
   - Redis para análises frequentes
   - Cache de dados públicos

4. **Escalar horizontalmente**
   - Load balancer
   - Múltiplas instâncias

---

## 🔍 Troubleshooting

### Erro: Connection refused

```bash
# Certifique-se de que a aplicação está rodando
pnpm dev

# Verifique a porta
lsof -i :3000
```

### Erro: Invalid token

```bash
# Gere um novo token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "loadtest@example.com",
    "password": "LoadTest123!"
  }'
```

### Muitas requisições falhando

```bash
# Verifique os logs do servidor
pnpm dev

# Reduza o número de VUs
k6 run k6/load-test.js --vus 10 --duration 5m
```

---

## 📚 Recursos Adicionais

- [k6 Documentation](https://k6.io/docs/)
- [k6 Best Practices](https://k6.io/docs/misc/best-practices/)
- [Performance Testing Guide](https://k6.io/docs/test-types/load-test/)

---

**Última atualização:** 21 de janeiro de 2026
