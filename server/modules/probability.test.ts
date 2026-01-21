import { describe, it, expect } from 'vitest';
import { calculateProbability } from './probability.js';

describe('Probability Module', () => {
  describe('Basic Calculation', () => {
    it('should return a probability score between 0 and 1', () => {
      const promises = [
        {
          text: 'Vou aumentar os salários',
          confidence: 0.8,
          category: 'EMPLOYMENT',
          entities: [],
        },
      ];

      const score = calculateProbability(promises, 'EMPLOYMENT');

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should handle empty promises array', () => {
      const score = calculateProbability([], 'ECONOMY');

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('Specificity Factor', () => {
    it('should score specific promises higher', () => {
      const vague = [
        {
          text: 'Vou melhorar tudo',
          confidence: 0.5,
          category: 'OTHER',
          entities: [],
        },
      ];

      const specific = [
        {
          text: 'Vou aumentar o salário mínimo para R$ 1500 em 2024',
          confidence: 0.9,
          category: 'EMPLOYMENT',
          entities: ['R$ 1500', '2024'],
        },
      ];

      const vagueScore = calculateProbability(vague, 'OTHER');
      const specificScore = calculateProbability(specific, 'EMPLOYMENT');

      expect(specificScore).toBeGreaterThan(vagueScore);
    });
  });

  describe('Category Matching', () => {
    it('should boost score when category matches', () => {
      const promises = [
        {
          text: 'Vou construir escolas',
          confidence: 0.7,
          category: 'EDUCATION',
          entities: [],
        },
      ];

      const matchingScore = calculateProbability(promises, 'EDUCATION');
      const nonMatchingScore = calculateProbability(promises, 'HEALTH');

      expect(matchingScore).toBeGreaterThan(nonMatchingScore);
    });
  });

  describe('Multiple Promises', () => {
    it('should average scores from multiple promises', () => {
      const promises = [
        {
          text: 'Vou aumentar salários',
          confidence: 0.9,
          category: 'EMPLOYMENT',
          entities: [],
        },
        {
          text: 'Vou reduzir impostos',
          confidence: 0.7,
          category: 'ECONOMY',
          entities: [],
        },
      ];

      const score = calculateProbability(promises, 'ECONOMY');

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should weight high-confidence promises more', () => {
      const lowConfidence = [
        {
          text: 'Talvez melhore algo',
          confidence: 0.3,
          category: 'OTHER',
          entities: [],
        },
      ];

      const highConfidence = [
        {
          text: 'Vou definitivamente aumentar salários',
          confidence: 0.95,
          category: 'EMPLOYMENT',
          entities: [],
        },
      ];

      const lowScore = calculateProbability(lowConfidence, 'OTHER');
      const highScore = calculateProbability(highConfidence, 'EMPLOYMENT');

      expect(highScore).toBeGreaterThan(lowScore);
    });
  });

  describe('Historical Compliance', () => {
    it('should consider category viability', () => {
      // Categorias com histórico melhor têm score mais alto
      const healthPromise = [
        {
          text: 'Vou melhorar a saúde',
          confidence: 0.7,
          category: 'HEALTH',
          entities: [],
        },
      ];

      const score = calculateProbability(healthPromise, 'HEALTH');

      // Score deve ser razoável para uma promessa de saúde
      expect(score).toBeGreaterThan(0.3);
    });
  });

  describe('Temporal Factors', () => {
    it('should handle promises with timeframes', () => {
      const withTimeframe = [
        {
          text: 'Vou criar 100 mil empregos em 2 anos',
          confidence: 0.8,
          category: 'EMPLOYMENT',
          entities: ['100 mil', '2 anos'],
        },
      ];

      const withoutTimeframe = [
        {
          text: 'Vou criar empregos',
          confidence: 0.8,
          category: 'EMPLOYMENT',
          entities: [],
        },
      ];

      const withScore = calculateProbability(withTimeframe, 'EMPLOYMENT');
      const withoutScore = calculateProbability(withoutTimeframe, 'EMPLOYMENT');

      // Promessas com timeframe devem ser mais específicas
      expect(withScore).toBeGreaterThanOrEqual(withoutScore);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very high confidence scores', () => {
      const promises = [
        {
          text: 'Vou definitivamente fazer X',
          confidence: 1.0,
          category: 'ECONOMY',
          entities: [],
        },
      ];

      const score = calculateProbability(promises, 'ECONOMY');

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should handle very low confidence scores', () => {
      const promises = [
        {
          text: 'Talvez eu faça algo',
          confidence: 0.1,
          category: 'OTHER',
          entities: [],
        },
      ];

      const score = calculateProbability(promises, 'OTHER');

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should handle null or undefined category', () => {
      const promises = [
        {
          text: 'Vou fazer algo',
          confidence: 0.7,
          category: 'OTHER',
          entities: [],
        },
      ];

      const score1 = calculateProbability(promises, undefined as any);
      const score2 = calculateProbability(promises, null as any);

      expect(score1).toBeGreaterThanOrEqual(0);
      expect(score2).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Consistency', () => {
    it('should return consistent results for same input', () => {
      const promises = [
        {
          text: 'Vou aumentar salários',
          confidence: 0.8,
          category: 'EMPLOYMENT',
          entities: [],
        },
      ];

      const score1 = calculateProbability(promises, 'EMPLOYMENT');
      const score2 = calculateProbability(promises, 'EMPLOYMENT');

      expect(score1).toBe(score2);
    });
  });
});
