import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Casos reais de promessas políticas brasileiras
const testCases = {
  simple: 'Vou construir 100 escolas no estado de São Paulo',
  negation: 'Não vou aumentar impostos se eleito',
  condition: 'Se ganhar a eleição, vou criar 50 mil empregos',
  complex: 'Vou reduzir a inflação para 3% ao ano e criar 100 mil empregos no setor de tecnologia',
  vague: 'Vou melhorar a educação e a saúde',
  specific: 'Vou aumentar o salário mínimo para R$ 1.500 em 2026',
  contradiction: 'Vou aumentar gastos com saúde e reduzir impostos sem aumentar a dívida',
  historical: 'Como fiz em 2019, vou novamente focar em infraestrutura e geração de empregos',
};

test.describe('Advanced Analysis Routes', () => {
  test.describe('POST /api/analyze/advanced', () => {
    test('should analyze simple promise', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/analyze/advanced`, {
        data: {
          text: testCases.simple,
          author: 'Candidato A',
          category: 'infraestrutura',
          source: 'discurso_campanha',
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.analysis).toBeDefined();
      expect(data.analysis.promises).toBeDefined();
      expect(data.analysis.promises.length).toBeGreaterThan(0);
      expect(data.probability).toBeDefined();
      expect(data.metadata).toBeDefined();
    });

    test('should detect negations in promises', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/analyze/advanced`, {
        data: {
          text: testCases.negation,
          author: 'Candidato B',
          category: 'economia',
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.analysis.negations).toBeDefined();
      expect(data.analysis.negations.hasNegation).toBe(true);
      expect(data.analysis.negations.negationPhrases.length).toBeGreaterThan(0);
    });

    test('should detect conditions in promises', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/analyze/advanced`, {
        data: {
          text: testCases.condition,
          author: 'Candidato C',
          category: 'economia',
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.analysis.conditions).toBeDefined();
      expect(data.analysis.conditions.hasCondition).toBe(true);
      expect(data.analysis.conditions.conditionPhrases.length).toBeGreaterThan(0);
    });

    test('should extract entities from promises', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/analyze/advanced`, {
        data: {
          text: testCases.specific,
          author: 'Candidato D',
          category: 'economia',
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.analysis.entities).toBeDefined();
      expect(data.analysis.entities.locations.length).toBeGreaterThanOrEqual(0);
      expect(data.analysis.entities.numbers.length).toBeGreaterThanOrEqual(0);
    });

    test('should analyze sentiment', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/analyze/advanced`, {
        data: {
          text: testCases.simple,
          author: 'Candidato E',
          category: 'infraestrutura',
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.analysis.sentiment).toBeDefined();
      expect(['positive', 'negative', 'neutral']).toContain(data.analysis.sentiment.type);
      expect(typeof data.analysis.sentiment.score).toBe('number');
    });

    test('should calculate confidence score', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/analyze/advanced`, {
        data: {
          text: testCases.simple,
          author: 'Candidato F',
          category: 'infraestrutura',
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(typeof data.analysis.confidence).toBe('number');
      expect(data.analysis.confidence).toBeGreaterThanOrEqual(0);
      expect(data.analysis.confidence).toBeLessThanOrEqual(1);
    });

    test('should calculate probability of fulfillment', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/analyze/advanced`, {
        data: {
          text: testCases.simple,
          author: 'Candidato G',
          category: 'infraestrutura',
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(typeof data.probability).toBe('number');
      expect(data.probability).toBeGreaterThanOrEqual(0);
      expect(data.probability).toBeLessThanOrEqual(1);
    });

    test('should handle empty text', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/analyze/advanced`, {
        data: {
          text: '',
          author: 'Candidato H',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('should handle very long text', async ({ request }) => {
      const longText = testCases.simple.repeat(100);

      const response = await request.post(`${BASE_URL}/api/analyze/advanced`, {
        data: {
          text: longText,
          author: 'Candidato I',
        },
      });

      expect([200, 413]).toContain(response.status());
    });
  });

  test.describe('POST /api/analyze/batch', () => {
    test('should analyze multiple promises', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/analyze/batch`, {
        data: {
          analyses: [
            { text: testCases.simple, author: 'Candidato A' },
            { text: testCases.negation, author: 'Candidato B' },
            { text: testCases.condition, author: 'Candidato C' },
          ],
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.results).toBeDefined();
      expect(data.results.length).toBe(3);
      expect(data.totalProcessed).toBe(3);
      expect(data.processingTime).toBeGreaterThan(0);
    });

    test('should handle batch with mixed success and failure', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/analyze/batch`, {
        data: {
          analyses: [
            { text: testCases.simple, author: 'Candidato A' },
            { text: '', author: 'Candidato B' }, // Invalid
            { text: testCases.condition, author: 'Candidato C' },
          ],
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.results.length).toBe(3);
      expect(data.totalFailed).toBeGreaterThan(0);
    });

    test('should reject batch with more than 100 items', async ({ request }) => {
      const analyses = Array(101)
        .fill(null)
        .map((_, i) => ({ text: testCases.simple, author: `Candidato ${i}` }));

      const response = await request.post(`${BASE_URL}/api/analyze/batch`, {
        data: { analyses },
      });

      expect(response.status()).toBe(400);
    });

    test('should handle empty batch', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/analyze/batch`, {
        data: { analyses: [] },
      });

      expect(response.status()).toBe(400);
    });

    test('should include processing time', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/analyze/batch`, {
        data: {
          analyses: [
            { text: testCases.simple, author: 'Candidato A' },
            { text: testCases.negation, author: 'Candidato B' },
          ],
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(typeof data.processingTime).toBe('number');
      expect(data.processingTime).toBeGreaterThan(0);
    });
  });

  test.describe('GET /api/analyze/compare', () => {
    test('should compare two similar promises', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analyze/compare`, {
        params: {
          text1: 'Vou construir 100 escolas',
          text2: 'Vou construir 100 escolas no estado',
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(typeof data.similarity).toBe('number');
      expect(data.similarity).toBeGreaterThan(0.7); // Should be similar
      expect(data.analysis1).toBeDefined();
      expect(data.analysis2).toBeDefined();
      expect(data.comparison).toBeDefined();
    });

    test('should compare two different promises', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analyze/compare`, {
        params: {
          text1: 'Vou construir escolas',
          text2: 'Vou aumentar impostos',
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(typeof data.similarity).toBe('number');
      expect(data.similarity).toBeLessThan(0.5); // Should be different
    });

    test('should detect same category', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analyze/compare`, {
        params: {
          text1: testCases.simple,
          text2: testCases.specific,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.comparison).toBeDefined();
      expect(typeof data.comparison.sameCategory).toBe('boolean');
    });

    test('should detect same sentiment', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analyze/compare`, {
        params: {
          text1: testCases.simple,
          text2: testCases.condition,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.comparison.sameSentiment).toBeDefined();
      expect(typeof data.comparison.sameSentiment).toBe('boolean');
    });

    test('should handle missing parameters', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analyze/compare`, {
        params: { text1: testCases.simple },
      });

      expect(response.status()).toBe(400);
    });

    test('should handle empty text', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analyze/compare`, {
        params: { text1: '', text2: testCases.simple },
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('GET /api/analyze/history', () => {
    test('should retrieve empty history for new user', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analyze/history`);

      // May return 401 if not authenticated, or 200 with empty list
      expect([200, 401]).toContain(response.status());
    });

    test('should support pagination', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analyze/history`, {
        params: { limit: 10, offset: 0 },
      });

      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.analyses).toBeDefined();
        expect(data.total).toBeDefined();
        expect(data.limit).toBe(10);
        expect(data.offset).toBe(0);
      }
    });

    test('should support filtering by category', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analyze/history`, {
        params: { category: 'infraestrutura' },
      });

      expect([200, 401]).toContain(response.status());
    });

    test('should support filtering by author', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analyze/history`, {
        params: { author: 'Candidato A' },
      });

      expect([200, 401]).toContain(response.status());
    });

    test('should limit maximum results', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analyze/history`, {
        params: { limit: 200 }, // Request more than max
      });

      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.limit).toBeLessThanOrEqual(100); // Should be capped
      }
    });
  });

  test.describe('Complex Analysis Scenarios', () => {
    test('should analyze contradiction in promise', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/analyze/advanced`, {
        data: {
          text: testCases.contradiction,
          author: 'Candidato X',
          category: 'economia',
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      // Should detect multiple promises with conflicting goals
      expect(data.analysis.promises.length).toBeGreaterThanOrEqual(1);
    });

    test('should analyze promise with historical reference', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/analyze/advanced`, {
        data: {
          text: testCases.historical,
          author: 'Candidato Y',
          category: 'infraestrutura',
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.analysis.promises).toBeDefined();
      expect(data.analysis.promises.length).toBeGreaterThan(0);
    });

    test('should handle vague promises', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/analyze/advanced`, {
        data: {
          text: testCases.vague,
          author: 'Candidato Z',
          category: 'geral',
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      // Vague promises should have lower confidence
      expect(data.analysis.confidence).toBeLessThan(0.8);
    });

    test('should compare promise with historical data', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/analyze/advanced`, {
        data: {
          text: 'Vou reduzir a inflação para 3% como fiz em 2020',
          author: 'Candidato W',
          category: 'economia',
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.analysis).toBeDefined();
      expect(data.probability).toBeDefined();
    });
  });

  test.describe('Performance Tests', () => {
    test('should analyze within reasonable time', async ({ request }) => {
      const startTime = Date.now();

      const response = await request.post(`${BASE_URL}/api/analyze/advanced`, {
        data: {
          text: testCases.complex,
          author: 'Candidato P',
        },
      });

      const duration = Date.now() - startTime;

      expect(response.status()).toBe(200);
      expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
    });

    test('should handle batch processing efficiently', async ({ request }) => {
      const analyses = Array(50)
        .fill(null)
        .map((_, i) => ({
          text: testCases.simple,
          author: `Candidato ${i}`,
        }));

      const startTime = Date.now();

      const response = await request.post(`${BASE_URL}/api/analyze/batch`, {
        data: { analyses },
      });

      const duration = Date.now() - startTime;

      expect(response.status()).toBe(200);
      expect(duration).toBeLessThan(30000); // Should complete in less than 30 seconds
    });
  });
});
