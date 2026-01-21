import { describe, it, expect } from 'vitest';
import { extractPromises } from './nlp.js';

describe('NLP Module - Promise Extraction', () => {
  describe('Basic Promise Detection', () => {
    it('should extract simple promise', () => {
      const text = 'Vou construir 1000 escolas em São Paulo';
      const promises = extractPromises(text);

      expect(promises.length).toBeGreaterThan(0);
      expect(promises[0].text).toContain('construir');
      expect(promises[0].text).toContain('escolas');
    });

    it('should extract multiple promises', () => {
      const text = `
        Vou aumentar os salários dos professores.
        Vou reduzir a criminalidade em 50%.
        Vou construir hospitais em todas as cidades.
      `;
      const promises = extractPromises(text);

      expect(promises.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle empty text', () => {
      const text = '';
      const promises = extractPromises(text);

      expect(Array.isArray(promises)).toBe(true);
      expect(promises.length).toBe(0);
    });

    it('should handle text without promises', () => {
      const text = 'Este é um texto neutro sem promessas políticas.';
      const promises = extractPromises(text);

      expect(Array.isArray(promises)).toBe(true);
    });
  });

  describe('Promise Categories', () => {
    it('should categorize education promises', () => {
      const text = 'Vou melhorar a educação nas escolas públicas';
      const promises = extractPromises(text);

      const hasEducation = promises.some(p => p.category === 'EDUCATION');
      expect(hasEducation).toBe(true);
    });

    it('should categorize health promises', () => {
      const text = 'Vou construir novos hospitais e ampliar o SUS';
      const promises = extractPromises(text);

      const hasHealth = promises.some(p => p.category === 'HEALTH');
      expect(hasHealth).toBe(true);
    });

    it('should categorize economy promises', () => {
      const text = 'Vou reduzir a inflação e gerar empregos';
      const promises = extractPromises(text);

      const hasEconomy = promises.some(p => p.category === 'ECONOMY');
      expect(hasEconomy).toBe(true);
    });

    it('should categorize infrastructure promises', () => {
      const text = 'Vou construir estradas e ferrovias';
      const promises = extractPromises(text);

      const hasInfra = promises.some(p => p.category === 'INFRASTRUCTURE');
      expect(hasInfra).toBe(true);
    });
  });

  describe('Confidence Scoring', () => {
    it('should assign confidence scores', () => {
      const text = 'Vou definitivamente aumentar os salários dos professores';
      const promises = extractPromises(text);

      expect(promises.length).toBeGreaterThan(0);
      promises.forEach(promise => {
        expect(promise.confidence).toBeGreaterThanOrEqual(0);
        expect(promise.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should assign higher confidence to specific promises', () => {
      const vague = extractPromises('Vou melhorar tudo');
      const specific = extractPromises('Vou aumentar o salário mínimo para R$ 1500');

      const vagueConfidence = vague[0]?.confidence || 0;
      const specificConfidence = specific[0]?.confidence || 0;

      expect(specificConfidence).toBeGreaterThanOrEqual(vagueConfidence);
    });
  });

  describe('Entity Extraction', () => {
    it('should extract entities from promises', () => {
      const text = 'Vou aumentar os salários dos professores em São Paulo';
      const promises = extractPromises(text);

      expect(promises.length).toBeGreaterThan(0);
      const entities = promises[0].entities || [];
      expect(Array.isArray(entities)).toBe(true);
    });

    it('should identify numbers in promises', () => {
      const text = 'Vou criar 10000 empregos em 2 anos';
      const promises = extractPromises(text);

      expect(promises.length).toBeGreaterThan(0);
      const entities = promises[0].entities || [];
      expect(entities.some(e => e.includes('10000') || e.includes('2'))).toBe(true);
    });
  });

  describe('Language Variations', () => {
    it('should handle different promise verbs', () => {
      const texts = [
        'Vou construir escolas',
        'Vamos aumentar os salários',
        'Irei reduzir a criminalidade',
        'Pretendo melhorar a saúde',
      ];

      texts.forEach(text => {
        const promises = extractPromises(text);
        expect(promises.length).toBeGreaterThan(0);
      });
    });

    it('should handle negations', () => {
      const text = 'Não vou aumentar impostos';
      const promises = extractPromises(text);

      expect(promises.length).toBeGreaterThan(0);
    });

    it('should handle conditional promises', () => {
      const text = 'Se eleito, vou reduzir a violência';
      const promises = extractPromises(text);

      expect(promises.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long text', () => {
      const longText = 'Vou construir escolas. '.repeat(100);
      const promises = extractPromises(longText);

      expect(Array.isArray(promises)).toBe(true);
    });

    it('should handle special characters', () => {
      const text = 'Vou aumentar salários (dos professores) & reduzir impostos!';
      const promises = extractPromises(text);

      expect(Array.isArray(promises)).toBe(true);
    });

    it('should handle mixed case', () => {
      const text = 'VOU CONSTRUIR ESCOLAS e reduzir CRIMINALIDADE';
      const promises = extractPromises(text);

      expect(promises.length).toBeGreaterThan(0);
    });
  });
});
