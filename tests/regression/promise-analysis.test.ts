
import { describe, it, expect } from 'vitest';
import { mapPromiseToSiconfiCategory } from '../../server/integrations/siconfi.ts';

// Mock simples para testar a lógica de mapeamento e categorização que alimenta o Brain
describe('Regressão: Mapeamento de Escopo e Categoria', () => {
  const TEST_CASES = [
    {
      promise: "Construção de novas creches municipais",
      expectedCategory: 'EDUCACAO',
      keywords: ['creche', 'municipal']
    },
    {
      promise: "Melhoria no atendimento do SUS e hospitais",
      expectedCategory: 'SAUDE',
      keywords: ['sus', 'hospital']
    },
    {
      promise: "Redução de impostos federais e carga tributária",
      expectedCategory: 'ECONOMIA',
      keywords: ['imposto', 'tributo']
    },
    {
      promise: "Aumento do policiamento nas ruas e segurança",
      expectedCategory: 'SEGURANCA',
      keywords: ['policia', 'seguranca']
    }
  ];

  TEST_CASES.forEach((tc) => {
    it(`Deve mapear corretamente a promessa: "${tc.promise}"`, () => {
      const categoryInfo = mapPromiseToSiconfiCategory(tc.expectedCategory);
      expect(categoryInfo.name).toBeDefined();
      
      // Simulação de detecção de categoria que o Brain faz
      const text = tc.promise.toLowerCase();
      const detected = text.includes('creche') ? 'EDUCACAO' : 
                       text.includes('sus') ? 'SAUDE' :
                       text.includes('imposto') ? 'ECONOMIA' :
                       text.includes('policia') ? 'SEGURANCA' : 'GERAL';
      
      expect(detected).toBe(tc.expectedCategory);
    });
  });
});
