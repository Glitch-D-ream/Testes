import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { initializeDatabase } from './core/database.js';
import { setupRoutes } from './core/routes.js';
import { nanoid } from 'nanoid';
import { generateJWT } from './core/auth.js';

let app: express.Application;
let server: any;
const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

// Mock user para testes
const mockUser = {
  userId: 'test-user-' + nanoid(),
  email: 'test@example.com',
  role: 'user' as const,
};

const mockToken = generateJWT(mockUser);

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Inicializar banco de dados
    await initializeDatabase();

    // Criar aplicação Express
    app = express();
    app.use(express.json());

    // Configurar rotas
    setupRoutes(app);

    // Iniciar servidor
    server = app.listen(PORT, () => {
      console.log(`Test server running on port ${PORT}`);
    });
  });

  afterAll(async () => {
    // Fechar servidor
    return new Promise((resolve) => {
      server.close(() => {
        console.log('Test server closed');
        resolve(undefined);
      });
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('Analysis Endpoint', () => {
    it('should submit analysis without authentication', async () => {
      const analysisData = {
        text: 'Vou construir 1000 escolas em todo o país',
        author: 'Candidato X',
        category: 'EDUCATION',
      };

      const response = await fetch(`${BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.probabilityScore).toBeGreaterThanOrEqual(0);
      expect(data.probabilityScore).toBeLessThanOrEqual(1);
      expect(data.promisesCount).toBeGreaterThan(0);
    });

    it('should reject analysis with invalid text', async () => {
      const analysisData = {
        text: 'short',
        author: 'Candidato X',
      };

      const response = await fetch(`${BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should extract promises from analysis', async () => {
      const analysisData = {
        text: 'Vou aumentar salários e reduzir impostos',
        author: 'Candidato Y',
        category: 'ECONOMY',
      };

      const response = await fetch(`${BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      });

      const data = await response.json();
      expect(data.promises).toBeDefined();
      expect(Array.isArray(data.promises)).toBe(true);
      expect(data.promises.length).toBeGreaterThan(0);
    });

    it('should handle authenticated requests', async () => {
      const analysisData = {
        text: 'Vou melhorar a saúde pública do país',
        author: 'Candidato Z',
        category: 'HEALTH',
      };

      const response = await fetch(`${BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`,
        },
        body: JSON.stringify(analysisData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.id).toBeDefined();
    });
  });

  describe('Analysis Retrieval', () => {
    let analysisId: string;

    beforeAll(async () => {
      // Criar uma análise para recuperar
      const analysisData = {
        text: 'Vou construir hospitais em todas as cidades',
        author: 'Candidato Test',
        category: 'HEALTH',
      };

      const response = await fetch(`${BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      });

      const data = await response.json();
      analysisId = data.id;
    });

    it('should retrieve analysis by ID', async () => {
      const response = await fetch(`${BASE_URL}/api/analysis/${analysisId}`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(analysisId);
      expect(data.text).toBeDefined();
      expect(data.promises).toBeDefined();
    });

    it('should return 404 for non-existent analysis', async () => {
      const response = await fetch(`${BASE_URL}/api/analysis/non-existent-id`);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should export analysis as JSON', async () => {
      const response = await fetch(`${BASE_URL}/api/analysis/${analysisId}/export`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.analysis).toBeDefined();
      expect(data.promises).toBeDefined();
      expect(data.methodology).toBeDefined();
      expect(data.methodology.disclaimer).toBeDefined();
    });
  });

  describe('Analyses List', () => {
    it('should list recent analyses', async () => {
      const response = await fetch(`${BASE_URL}/api/analyses`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.analyses)).toBe(true);
      expect(data.total).toBeGreaterThanOrEqual(0);
      expect(data.limit).toBeDefined();
      expect(data.offset).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await fetch(`${BASE_URL}/api/analyses?limit=10&offset=0`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.limit).toBe(10);
      expect(data.offset).toBe(0);
    });

    it('should limit maximum results', async () => {
      const response = await fetch(`${BASE_URL}/api/analyses?limit=1000`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.limit).toBeLessThanOrEqual(100);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting for anonymous users', async () => {
      const analysisData = {
        text: 'Vou fazer algo importante para o país',
        author: 'Test',
      };

      // Fazer múltiplas requisições
      const requests = Array(15)
        .fill(null)
        .map(() =>
          fetch(`${BASE_URL}/api/analyze`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(analysisData),
          })
        );

      const responses = await Promise.all(requests);

      // Algumas requisições devem ser bloqueadas
      const blockedRequests = responses.filter((r) => r.status === 429);
      expect(blockedRequests.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await fetch(`${BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json {',
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle missing required fields', async () => {
      const response = await fetch(`${BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author: 'Test',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('LGPD Endpoints', () => {
    it('should require authentication for data export', async () => {
      const response = await fetch(`${BASE_URL}/api/user/data/export`);

      expect(response.status).toBe(401);
    });

    it('should export user data when authenticated', async () => {
      const response = await fetch(`${BASE_URL}/api/user/data/export`, {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.analyses).toBeDefined();
      expect(data.auditLogs).toBeDefined();
    });

    it('should require authentication for data deletion', async () => {
      const response = await fetch(`${BASE_URL}/api/user/data`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(401);
    });
  });
});
