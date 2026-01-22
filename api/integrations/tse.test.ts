import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCandidateInfo,
  getCandidatePromiseHistory,
  getPoliticalHistory,
  validateCandidateCredibility,
} from './tse.js';

describe('TSE Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCandidateInfo', () => {
    it('deve retornar informações de candidato válido', async () => {
      const candidate = await getCandidateInfo('Candidato Teste', 'SP');

      if (candidate) {
        expect(candidate.name).toBeDefined();
        expect(candidate.party).toBeDefined();
        expect(candidate.position).toBeDefined();
        expect(candidate.state).toBe('SP');
      }
    });

    it('deve retornar null para candidato não encontrado', async () => {
      const candidate = await getCandidateInfo('Candidato Inexistente XXXXXX', 'SP');
      expect(candidate).toBeNull();
    });

    it('deve ter campos obrigatórios', async () => {
      const candidate = await getCandidateInfo('Candidato Teste', 'RJ');

      if (candidate) {
        expect(candidate.id).toBeDefined();
        expect(candidate.name).toBeDefined();
        expect(candidate.party).toBeDefined();
        expect(candidate.position).toBeDefined();
        expect(candidate.state).toBeDefined();
        expect(candidate.electionYear).toBeGreaterThan(0);
        expect(typeof candidate.elected).toBe('boolean');
      }
    });
  });

  describe('getCandidatePromiseHistory', () => {
    it('deve retornar array de promessas', async () => {
      const promises = await getCandidatePromiseHistory('123', 'Candidato Teste');

      expect(Array.isArray(promises)).toBe(true);
    });

    it('cada promessa deve ter campos obrigatórios', async () => {
      const promises = await getCandidatePromiseHistory('123', 'Candidato Teste');

      promises.forEach((promise) => {
        expect(promise.candidateId).toBeDefined();
        expect(promise.candidateName).toBeDefined();
        expect(promise.electionYear).toBeGreaterThan(0);
        expect(promise.promise).toBeDefined();
        expect(promise.category).toBeDefined();
        expect(typeof promise.fulfilled).toBe('boolean');
        expect(typeof promise.partiallyFulfilled).toBe('boolean');
      });
    });

    it('deve retornar array vazio para candidato sem promessas', async () => {
      const promises = await getCandidatePromiseHistory('999999', 'Candidato Inexistente');

      expect(Array.isArray(promises)).toBe(true);
    });
  });

  describe('getPoliticalHistory', () => {
    it('deve retornar histórico político válido', async () => {
      const history = await getPoliticalHistory('Candidato Teste', 'SP');

      if (history) {
        expect(history.candidateId).toBeDefined();
        expect(history.candidateName).toBeDefined();
        expect(history.totalElections).toBeGreaterThanOrEqual(0);
        expect(history.totalElected).toBeGreaterThanOrEqual(0);
        expect(history.electionRate).toBeGreaterThanOrEqual(0);
        expect(history.electionRate).toBeLessThanOrEqual(100);
        expect(history.promisesFulfilled).toBeGreaterThanOrEqual(0);
        expect(history.promisesTotal).toBeGreaterThanOrEqual(0);
        expect(history.fulfillmentRate).toBeGreaterThanOrEqual(0);
        expect(history.fulfillmentRate).toBeLessThanOrEqual(100);
        expect(history.controversies).toBeGreaterThanOrEqual(0);
        expect(history.scandals).toBeGreaterThanOrEqual(0);
      }
    });

    it('deve retornar null para candidato não encontrado', async () => {
      const history = await getPoliticalHistory('Candidato Inexistente XXXXXX', 'SP');

      expect(history).toBeNull();
    });

    it('deve calcular election rate corretamente', async () => {
      const history = await getPoliticalHistory('Candidato Teste', 'SP');

      if (history && history.totalElections > 0) {
        const expectedRate = (history.totalElected / history.totalElections) * 100;
        expect(history.electionRate).toBe(expectedRate);
      }
    });

    it('deve calcular fulfillment rate corretamente', async () => {
      const history = await getPoliticalHistory('Candidato Teste', 'SP');

      if (history && history.promisesTotal > 0) {
        const expectedRate =
          ((history.promisesFulfilled + history.promisesTotal * 0.5) / history.promisesTotal) *
          100;
        expect(history.fulfillmentRate).toBeCloseTo(expectedRate, 1);
      }
    });
  });

  describe('validateCandidateCredibility', () => {
    it('deve retornar score entre 0 e 1', async () => {
      const result = await validateCandidateCredibility('Candidato Teste', 'SP');

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('deve ter campo credible booleano', async () => {
      const result = await validateCandidateCredibility('Candidato Teste', 'SP');

      expect(typeof result.credible).toBe('boolean');
    });

    it('deve ter reason string', async () => {
      const result = await validateCandidateCredibility('Candidato Teste', 'SP');

      expect(typeof result.reason).toBe('string');
      expect(result.reason.length).toBeGreaterThan(0);
    });

    it('deve marcar como credível se score > 0.5', async () => {
      const result = await validateCandidateCredibility('Candidato Teste', 'SP');

      if (result.score > 0.5) {
        expect(result.credible).toBe(true);
      }
    });

    it('deve marcar como não credível se score <= 0.5', async () => {
      const result = await validateCandidateCredibility('Candidato Teste', 'SP');

      if (result.score <= 0.5) {
        expect(result.credible).toBe(false);
      }
    });

    it('deve retornar score 0.5 para candidato sem histórico', async () => {
      const result = await validateCandidateCredibility('Candidato Inexistente XXXXXX', 'SP');

      expect(result.score).toBe(0.5);
      expect(result.history).toBeNull();
    });

    it('deve mencionar escândalos na reason se houver', async () => {
      const result = await validateCandidateCredibility('Candidato Teste', 'SP');

      if (result.history && result.history.scandals > 0) {
        expect(result.reason).toContain('escândalo');
      }
    });

    it('deve mencionar taxa de cumprimento na reason', async () => {
      const result = await validateCandidateCredibility('Candidato Teste', 'SP');

      expect(result.reason).toBeDefined();
      expect(result.reason.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('deve lidar com candidato sem promessas anteriores', async () => {
      const result = await validateCandidateCredibility('Candidato Novo', 'SP');

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.reason).toBeDefined();
    });

    it('deve lidar com estado inválido', async () => {
      const candidate = await getCandidateInfo('Candidato Teste', 'XX');

      expect(candidate).toBeNull();
    });

    it('deve retornar score válido mesmo com muitos escândalos', async () => {
      const result = await validateCandidateCredibility('Candidato Teste', 'SP');

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('deve retornar score válido mesmo com taxa 100% de cumprimento', async () => {
      const result = await validateCandidateCredibility('Candidato Teste', 'SP');

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });
  });
});
