# API Documentation

> **Detector de Promessa Vazia - REST API Reference**

Documentação completa de todos os endpoints disponíveis.

---

## 📋 Índice

1. [Autenticação](#autenticação)
2. [Análises](#análises)
3. [Histórico](#histórico)
4. [Dados Públicos](#dados-públicos)
5. [Usuário](#usuário)
6. [Admin](#admin)

---

## Autenticação

### Registrar Novo Usuário

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "senha_segura_123",
  "name": "Nome do Usuário",
  "consentLGPD": true
}
```

**Respostas:**

```json
// 201 Created
{
  "success": true,
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "name": "Nome do Usuário",
    "role": "user",
    "createdAt": "2026-01-21T17:45:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

```json
// 400 Bad Request
{
  "error": "Email já registrado"
}
```

---

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "senha_segura_123"
}
```

**Respostas:**

```json
// 200 OK
{
  "success": true,
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "name": "Nome do Usuário",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

```json
// 401 Unauthorized
{
  "error": "Email ou senha inválidos"
}
```

---

### Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Respostas:**

```json
// 200 OK
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Logout

```http
POST /api/auth/logout
Authorization: Bearer {token}
```

**Respostas:**

```json
// 200 OK
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

---

### Obter Usuário Atual

```http
GET /api/auth/me
Authorization: Bearer {token}
```

**Respostas:**

```json
// 200 OK
{
  "id": 1,
  "email": "usuario@example.com",
  "name": "Nome do Usuário",
  "role": "user",
  "createdAt": "2026-01-21T17:45:00Z",
  "lastSignedIn": "2026-01-21T17:50:00Z"
}
```

---

## Análises

### Submeter Análise

```http
POST /api/analysis
Authorization: Bearer {token}
Content-Type: application/json

{
  "text": "Vou construir 1000 escolas em todo o país",
  "author": "Candidato X",
  "state": "SP",
  "category": "EDUCATION",
  "source": "discurso_politico"
}
```

**Respostas:**

```json
// 201 Created
{
  "id": "analysis_123",
  "text": "Vou construir 1000 escolas em todo o país",
  "author": "Candidato X",
  "state": "SP",
  "promises": [
    {
      "id": "promise_1",
      "text": "construir 1000 escolas",
      "category": "EDUCATION",
      "confidence": 0.95,
      "specificity": 0.85
    }
  ],
  "results": {
    "overallProbability": 0.62,
    "confidenceInterval": {
      "min": 0.55,
      "max": 0.69
    },
    "factors": {
      "budgetaryViability": 0.7,
      "authorHistory": 0.65,
      "similarPromises": 0.6,
      "geographicScope": 0.55,
      "historicalTrends": 0.65
    }
  },
  "createdAt": "2026-01-21T17:45:00Z"
}
```

```json
// 400 Bad Request
{
  "error": "Texto vazio ou inválido"
}
```

```json
// 429 Too Many Requests
{
  "error": "Limite de análises excedido. Tente novamente em 1 hora."
}
```

---

### Obter Análise

```http
GET /api/analysis/{analysisId}
Authorization: Bearer {token}
```

**Respostas:**

```json
// 200 OK
{
  "id": "analysis_123",
  "text": "Vou construir 1000 escolas em todo o país",
  "author": "Candidato X",
  "state": "SP",
  "promises": [...],
  "results": {...},
  "createdAt": "2026-01-21T17:45:00Z",
  "updatedAt": "2026-01-21T17:45:00Z"
}
```

---

### Listar Análises do Usuário

```http
GET /api/analysis?page=1&limit=10&category=EDUCATION&state=SP
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (number, default: 1) - Página de resultados
- `limit` (number, default: 10) - Itens por página
- `category` (string) - Filtrar por categoria
- `state` (string) - Filtrar por estado
- `author` (string) - Filtrar por autor
- `sortBy` (string, default: "createdAt") - Campo para ordenação
- `order` (string, default: "desc") - Ordem (asc/desc)

**Respostas:**

```json
// 200 OK
{
  "data": [
    {
      "id": "analysis_123",
      "text": "Vou construir 1000 escolas...",
      "author": "Candidato X",
      "state": "SP",
      "results": {
        "overallProbability": 0.62
      },
      "createdAt": "2026-01-21T17:45:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

---

### Exportar Análise

```http
GET /api/analysis/{analysisId}/export?format=json
Authorization: Bearer {token}
```

**Query Parameters:**
- `format` (string, default: "json") - Formato de exportação (json, csv, pdf)

**Respostas:**

```json
// 200 OK (application/json)
{
  "id": "analysis_123",
  "text": "Vou construir 1000 escolas...",
  "author": "Candidato X",
  "promises": [...],
  "results": {...},
  "methodology": {
    "description": "Análise baseada em 5 fatores...",
    "factors": [...],
    "sources": [...]
  },
  "exportedAt": "2026-01-21T17:45:00Z"
}
```

---

## Histórico

### Obter Estatísticas de Análises

```http
GET /api/analytics
Authorization: Bearer {token}
```

**Respostas:**

```json
// 200 OK
{
  "totalAnalyses": 150,
  "totalPromises": 450,
  "averageProbability": 0.58,
  "byCategory": {
    "EDUCATION": 45,
    "HEALTH": 38,
    "INFRASTRUCTURE": 32,
    "EMPLOYMENT": 25,
    "OTHER": 10
  },
  "byState": {
    "SP": 50,
    "RJ": 35,
    "MG": 30,
    "BA": 25,
    "OTHER": 10
  },
  "probabilityDistribution": {
    "0-20%": 15,
    "20-40%": 35,
    "40-60%": 50,
    "60-80%": 35,
    "80-100%": 15
  }
}
```

---

### Obter Tendências

```http
GET /api/analytics/trends?period=30d&category=EDUCATION
Authorization: Bearer {token}
```

**Query Parameters:**
- `period` (string, default: "30d") - Período (7d, 30d, 90d, 1y)
- `category` (string) - Filtrar por categoria

**Respostas:**

```json
// 200 OK
{
  "period": "30d",
  "data": [
    {
      "date": "2026-01-21",
      "analysesCount": 5,
      "averageProbability": 0.62,
      "topCategory": "EDUCATION"
    }
  ]
}
```

---

## Dados Públicos

### Sincronizar Dados

```http
POST /api/sync
Authorization: Bearer {token}
Content-Type: application/json

{
  "source": "all" // "siconfi", "portal", "tse", "all"
}
```

**Respostas:**

```json
// 202 Accepted
{
  "success": true,
  "message": "Sincronização iniciada",
  "jobId": "sync_job_123",
  "estimatedDuration": "5-10 minutos"
}
```

---

### Obter Status de Sincronização

```http
GET /api/sync/status
Authorization: Bearer {token}
```

**Respostas:**

```json
// 200 OK
{
  "siconfi": {
    "lastSync": "2026-01-21T02:00:00Z",
    "nextSync": "2026-01-22T02:00:00Z",
    "status": "idle",
    "successCount": 45,
    "failureCount": 2,
    "lastError": null
  },
  "portal": {
    "lastSync": "2026-01-21T18:00:00Z",
    "nextSync": "2026-01-22T00:00:00Z",
    "status": "idle",
    "successCount": 120,
    "failureCount": 0,
    "lastError": null
  },
  "tse": {
    "lastSync": "2026-01-21T02:00:00Z",
    "nextSync": "2026-01-22T02:00:00Z",
    "status": "idle",
    "successCount": 30,
    "failureCount": 1,
    "lastError": null
  }
}
```

---

### Obter Dados de Orçamento

```http
GET /api/public-data/budget?year=2025&category=EDUCATION&state=SP
Authorization: Bearer {token}
```

**Query Parameters:**
- `year` (number) - Ano do orçamento
- `category` (string) - Categoria
- `state` (string) - Estado (opcional)
- `sphere` (string) - Esfera (FEDERAL, STATE, MUNICIPAL)

**Respostas:**

```json
// 200 OK
{
  "year": 2025,
  "category": "EDUCATION",
  "state": "SP",
  "sphere": "STATE",
  "budgeted": 5000000000,
  "executed": 4800000000,
  "executionRate": 0.96,
  "lastUpdated": "2026-01-21T02:00:00Z"
}
```

---

### Obter Histórico Político

```http
GET /api/public-data/candidate/{candidateName}?state=SP
Authorization: Bearer {token}
```

**Respostas:**

```json
// 200 OK
{
  "candidateId": "tse_123",
  "candidateName": "Candidato X",
  "party": "Partido Y",
  "state": "SP",
  "totalElections": 3,
  "totalElected": 2,
  "electionRate": 0.67,
  "promisesFulfilled": 15,
  "promisesTotal": 25,
  "fulfillmentRate": 0.60,
  "controversies": 2,
  "scandals": 1,
  "credibilityScore": 0.65,
  "lastUpdated": "2026-01-21T02:00:00Z"
}
```

---

## Usuário

### Obter Dados do Usuário

```http
GET /api/user/data
Authorization: Bearer {token}
```

**Respostas:**

```json
// 200 OK
{
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "name": "Nome do Usuário",
    "role": "user",
    "createdAt": "2026-01-21T17:45:00Z"
  },
  "analyses": [...],
  "consent": {
    "LGPD": true,
    "analytics": true,
    "marketing": false
  }
}
```

---

### Exportar Dados do Usuário (LGPD)

```http
GET /api/user/data/export
Authorization: Bearer {token}
```

**Respostas:**

```json
// 200 OK (application/json)
{
  "exportedAt": "2026-01-21T17:45:00Z",
  "user": {...},
  "analyses": [...],
  "consent": {...},
  "auditLog": [...]
}
```

---

### Deletar Dados do Usuário (Direito ao Esquecimento)

```http
DELETE /api/user/data
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Solicitar exclusão de dados pessoais",
  "confirmPassword": "senha_do_usuario"
}
```

**Respostas:**

```json
// 200 OK
{
  "success": true,
  "message": "Dados deletados com sucesso",
  "deletedAt": "2026-01-21T17:45:00Z",
  "note": "Seus dados serão permanentemente removidos em 30 dias"
}
```

---

### Atualizar Consentimentos

```http
PUT /api/user/consent
Authorization: Bearer {token}
Content-Type: application/json

{
  "LGPD": true,
  "analytics": true,
  "marketing": false
}
```

**Respostas:**

```json
// 200 OK
{
  "success": true,
  "consent": {
    "LGPD": true,
    "analytics": true,
    "marketing": false
  },
  "updatedAt": "2026-01-21T17:45:00Z"
}
```

---

## Admin

> **Requer role: admin**

### Listar Todos os Usuários

```http
GET /api/admin/users?page=1&limit=20
Authorization: Bearer {admin_token}
```

**Respostas:**

```json
// 200 OK
{
  "data": [
    {
      "id": 1,
      "email": "usuario@example.com",
      "name": "Nome do Usuário",
      "role": "user",
      "createdAt": "2026-01-21T17:45:00Z",
      "analysesCount": 15,
      "lastSignedIn": "2026-01-21T17:50:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

### Obter Logs de Auditoria

```http
GET /api/admin/audit-logs?page=1&limit=50&userId=1&action=LOGIN
Authorization: Bearer {admin_token}
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50)
- `userId` (number) - Filtrar por usuário
- `action` (string) - Filtrar por ação
- `startDate` (ISO string) - Data inicial
- `endDate` (ISO string) - Data final

**Respostas:**

```json
// 200 OK
{
  "data": [
    {
      "id": 1,
      "userId": 1,
      "action": "LOGIN",
      "resource": "auth",
      "details": "Login bem-sucedido",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2026-01-21T17:45:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 5000,
    "pages": 100
  }
}
```

---

### Obter Estatísticas do Sistema

```http
GET /api/admin/stats
Authorization: Bearer {admin_token}
```

**Respostas:**

```json
// 200 OK
{
  "users": {
    "total": 150,
    "active": 120,
    "inactive": 30
  },
  "analyses": {
    "total": 5000,
    "thisMonth": 450,
    "thisWeek": 100
  },
  "system": {
    "uptime": "45 dias",
    "lastSyncStatus": "success",
    "lastSyncTime": "2026-01-21T02:00:00Z",
    "databaseSize": "250 MB"
  }
}
```

---

## 🔑 Autenticação

Todos os endpoints protegidos requerem um token JWT no header:

```http
Authorization: Bearer {token}
```

Tokens expiram em **24 horas**. Use o endpoint de refresh para obter um novo token.

---

## ⚠️ Rate Limiting

- **Usuários Anônimos**: 10 análises/hora
- **Usuários Autenticados**: 50 análises/dia
- **Admin**: Sem limite

Headers de resposta incluem:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642777200
```

---

## 📊 Códigos de Status HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Requisição bem-sucedida |
| 201 | Created - Recurso criado |
| 202 | Accepted - Requisição aceita (async) |
| 400 | Bad Request - Erro na requisição |
| 401 | Unauthorized - Não autenticado |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Erro no servidor |

---

## 🔍 Exemplo de Fluxo Completo

```bash
# 1. Registrar
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "senha123",
    "name": "Usuário Teste",
    "consentLGPD": true
  }'

# 2. Fazer login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "senha123"
  }'

# 3. Submeter análise
curl -X POST http://localhost:3000/api/analysis \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Vou construir 1000 escolas",
    "author": "Candidato X",
    "state": "SP",
    "category": "EDUCATION"
  }'

# 4. Obter resultados
curl -X GET http://localhost:3000/api/analysis/analysis_123 \
  -H "Authorization: Bearer {token}"

# 5. Exportar análise
curl -X GET "http://localhost:3000/api/analysis/analysis_123/export?format=json" \
  -H "Authorization: Bearer {token}"
```

---

**Última atualização:** 21 de janeiro de 2026
