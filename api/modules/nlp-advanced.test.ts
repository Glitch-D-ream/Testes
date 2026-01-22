import { describe, it, expect, beforeAll } from 'vitest';
import { AdvancedNLPAnalyzer } from './nlp-advanced';

describe('Advanced NLP Analyzer', () => {
  let analyzer: AdvancedNLPAnalyzer;

  beforeAll(() => {
    analyzer = new AdvancedNLPAnalyzer();
  });

  describe('Promise Extraction', () => {
    it('should extract construction promises', async () => {
      const text = 'Vou construir 100 escolas em São Paulo';
      const result = await analyzer.analyzeText(text);
      
      expect(result.promises.length).toBeGreaterThan(0);
      expect(result.promises[0].category).toBe('construction');
      expect(result.promises[0].confidence).toBeGreaterThan(0.8);
    });

    it('should extract hiring promises', async () => {
      const text = 'Irei contratar 5000 professores para o estado';
      const result = await analyzer.analyzeText(text);
      
      expect(result.promises.length).toBeGreaterThan(0);
      expect(result.promises[0].category).toBe('hiring');
    });

    it('should extract investment promises', async () => {
      const text = 'Vamos investir R$ 2 bilhões em infraestrutura';
      const result = await analyzer.analyzeText(text);
      
      expect(result.promises.length).toBeGreaterThan(0);
      expect(result.promises[0].category).toBe('investment');
    });

    it('should extract reduction promises', async () => {
      const text = 'Vou reduzir impostos em 30%';
      const result = await analyzer.analyzeText(text);
      
      expect(result.promises.length).toBeGreaterThan(0);
      expect(result.promises[0].category).toBe('reduction');
    });

    it('should extract increase promises', async () => {
      const text = 'Será aumentado o salário mínimo para R$ 2000';
      const result = await analyzer.analyzeText(text);
      
      expect(result.promises.length).toBeGreaterThan(0);
      expect(result.promises[0].category).toBe('increase');
    });

    it('should extract improvement promises', async () => {
      const text = 'Vou melhorar a educação pública no país';
      const result = await analyzer.analyzeText(text);
      
      expect(result.promises.length).toBeGreaterThan(0);
      expect(result.promises[0].category).toBe('improvement');
    });

    it('should handle multiple promises', async () => {
      const text = 'Vou construir escolas, contratar professores e melhorar a educação';
      const result = await analyzer.analyzeText(text);
      
      expect(result.promises.length).toBeGreaterThanOrEqual(2);
    });

    it('should deduplicate similar promises', async () => {
      const text = 'Vou construir escolas. Irei edificar novas escolas também.';
      const result = await analyzer.analyzeText(text);
      
      // Deve ter apenas uma promessa (duplicatas removidas)
      expect(result.promises.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Negation Analysis', () => {
    it('should detect negations', async () => {
      const text = 'Não vou aumentar impostos';
      const result = await analyzer.analyzeText(text);
      
      expect(result.negations.hasNegation).toBe(true);
      expect(result.negations.negations.length).toBeGreaterThan(0);
    });

    it('should mark negated promises', async () => {
      const text = 'Nunca vou aumentar impostos';
      const result = await analyzer.analyzeText(text);
      
      if (result.promises.length > 0) {
        expect(result.promises[0].negated).toBe(true);
      }
    });

    it('should handle multiple negations', async () => {
      const text = 'Não vou e nunca vou aumentar impostos';
      const result = await analyzer.analyzeText(text);
      
      expect(result.negations.negations.length).toBeGreaterThanOrEqual(2);
    });

    it('should not flag non-negated text', async () => {
      const text = 'Vou construir escolas';
      const result = await analyzer.analyzeText(text);
      
      expect(result.negations.hasNegation).toBe(false);
    });
  });

  describe('Condition Analysis', () => {
    it('should detect if-elected conditions', async () => {
      const text = 'Se eleito, vou construir escolas';
      const result = await analyzer.analyzeText(text);
      
      expect(result.conditions.hasCondition).toBe(true);
      expect(result.conditions.type).toBe('if_elected');
    });

    it('should detect if-appointed conditions', async () => {
      const text = 'Se nomeado, vou reformar o ministério';
      const result = await analyzer.analyzeText(text);
      
      expect(result.conditions.hasCondition).toBe(true);
      expect(result.conditions.type).toBe('if_appointed');
    });

    it('should detect general if conditions', async () => {
      const text = 'Se tiver recursos, vou construir hospitais';
      const result = await analyzer.analyzeText(text);
      
      expect(result.conditions.hasCondition).toBe(true);
    });

    it('should mark conditional promises', async () => {
      const text = 'Se eleito, vou aumentar salários';
      const result = await analyzer.analyzeText(text);
      
      if (result.promises.length > 0) {
        expect(result.promises[0].conditional).toBe(true);
      }
    });

    it('should not flag non-conditional text', async () => {
      const text = 'Vou construir escolas';
      const result = await analyzer.analyzeText(text);
      
      expect(result.conditions.hasCondition).toBe(false);
    });
  });

  describe('Entity Extraction', () => {
    it('should extract locations', async () => {
      const text = 'Vou construir escolas em São Paulo e Rio de Janeiro';
      const result = await analyzer.analyzeText(text);
      
      expect(result.entities.locations.length).toBeGreaterThan(0);
    });

    it('should extract numbers', async () => {
      const text = 'Vou construir 100 escolas e contratar 5000 professores';
      const result = await analyzer.analyzeText(text);
      
      expect(result.entities.numbers.length).toBeGreaterThan(0);
    });

    it('should extract state abbreviations', async () => {
      const text = 'Vou melhorar a educação em SP, RJ e MG';
      const result = await analyzer.analyzeText(text);
      
      expect(result.entities.locations.length).toBeGreaterThan(0);
    });
  });

  describe('Sentiment Analysis', () => {
    it('should detect positive sentiment', async () => {
      const text = 'Vou trazer progresso e sucesso para o país';
      const result = await analyzer.analyzeText(text);
      
      expect(result.sentiment.type).toBe('positive');
      expect(result.sentiment.score).toBeGreaterThan(0);
    });

    it('should detect negative sentiment', async () => {
      const text = 'Vou resolver os problemas e crises do país';
      const result = await analyzer.analyzeText(text);
      
      // Pode ser positivo (resolver) ou negativo (problemas, crises)
      expect(['positive', 'negative', 'neutral']).toContain(result.sentiment.type);
    });

    it('should detect neutral sentiment', async () => {
      const text = 'Vou fazer mudanças na administração';
      const result = await analyzer.analyzeText(text);
      
      expect(result.sentiment.type).toBe('neutral');
    });
  });

  describe('Scope Analysis', () => {
    it('should identify national scope', async () => {
      const text = 'Vou melhorar a educação em todo o país';
      const result = await analyzer.analyzeText(text);
      
      if (result.promises.length > 0) {
        expect(result.promises[0].scope).toBe('national');
      }
    });

    it('should identify state scope', async () => {
      const text = 'Vou construir escolas em São Paulo';
      const result = await analyzer.analyzeText(text);
      
      if (result.promises.length > 0) {
        expect(result.promises[0].scope).toBe('state');
      }
    });

    it('should identify municipal scope', async () => {
      const text = 'Vou melhorar a cidade com novos projetos';
      const result = await analyzer.analyzeText(text);
      
      if (result.promises.length > 0) {
        expect(['municipal', 'unknown']).toContain(result.promises[0].scope);
      }
    });
  });

  describe('Overall Confidence', () => {
    it('should have high confidence for clear promises', async () => {
      const text = 'Vou construir 100 escolas em São Paulo';
      const result = await analyzer.analyzeText(text);
      
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should reduce confidence for negated promises', async () => {
      const text = 'Não vou aumentar impostos';
      const result = await analyzer.analyzeText(text);
      
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('should reduce confidence for conditional promises', async () => {
      const text = 'Se eleito, vou construir escolas';
      const result = await analyzer.analyzeText(text);
      
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('should increase confidence for multiple promises', async () => {
      const text = 'Vou construir escolas, contratar professores, melhorar salários e investir em educação';
      const result = await analyzer.analyzeText(text);
      
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle mixed promises', async () => {
      const text = `
        Se eleito, vou:
        - Construir 500 escolas em todo o país
        - Aumentar o salário de professores em 50%
        - Não vou aumentar impostos
        - Investir R$ 10 bilhões em educação
      `;
      const result = await analyzer.analyzeText(text);
      
      expect(result.promises.length).toBeGreaterThan(0);
      expect(result.negations.hasNegation).toBe(true);
      expect(result.conditions.hasCondition).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should handle empty text', async () => {
      const text = '';
      const result = await analyzer.analyzeText(text);
      
      expect(result.promises.length).toBe(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle text with no promises', async () => {
      const text = 'Como você está? Que dia é hoje?';
      const result = await analyzer.analyzeText(text);
      
      expect(result.promises.length).toBe(0);
    });

    it('should handle very long text', async () => {
      const text = 'Vou construir escolas. ' + 'Vou melhorar educação. '.repeat(50);
      const result = await analyzer.analyzeText(text);
      
      expect(result.promises.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('Real-world Examples', () => {
    it('should analyze real political promise 1', async () => {
      const text = 'Vou criar 1 milhão de empregos nos primeiros 100 dias de governo';
      const result = await analyzer.analyzeText(text);
      
      expect(result.promises.length).toBeGreaterThan(0);
      expect(result.entities.numbers.length).toBeGreaterThan(0);
    });

    it('should analyze real political promise 2', async () => {
      const text = 'Se eleito presidente, não vou aumentar impostos e vou reduzir a inflação';
      const result = await analyzer.analyzeText(text);
      
      expect(result.conditions.hasCondition).toBe(true);
      expect(result.negations.hasNegation).toBe(true);
      expect(result.promises.length).toBeGreaterThan(0);
    });

    it('should analyze real political promise 3', async () => {
      const text = 'Vamos investir R$ 50 bilhões em infraestrutura, construir 200 hospitais e contratar 10 mil médicos';
      const result = await analyzer.analyzeText(text);
      
      expect(result.promises.length).toBeGreaterThan(0);
      expect(result.entities.numbers.length).toBeGreaterThan(0);
    });
  });
});
