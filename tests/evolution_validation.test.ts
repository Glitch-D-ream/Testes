
import { describe, it, expect, vi } from 'vitest';
import { QueueManager } from '../server/core/queue-manager.ts';
import { RelationshipMiner } from '../server/modules/relationship-miner.ts';
import { ConfidenceScorer } from '../server/modules/confidence-scorer.ts';
import { scoutAgent } from '../server/agents/scout.ts';

// Mock do scoutAgent
vi.mock('../server/agents/scout.ts', () => ({
  scoutAgent: {
    search: vi.fn().mockResolvedValue([{ url: 'http://test.com', text: 'test' }])
  }
}));

describe('Seth VII Evolution - Validation Tests', () => {
  
  describe('QueueManager', () => {
    it('should execute legacy search when queues are disabled', async () => {
      QueueManager.setUseQueues(false);
      const result = await QueueManager.dispatchScrapingJob('Teste Político');
      expect(scoutAgent.search).toHaveBeenCalledWith('Teste Político', true);
      expect(result).toHaveLength(1);
    });
  });

  describe('RelationshipMiner', () => {
    it('should extract CNPJ and Process numbers from text', () => {
      const text = 'O contrato 12.345.678/0001-90 refere-se ao processo 1234567-89.2023.8.26.0000';
      // @ts-ignore - acessando método privado para teste
      const connections = RelationshipMiner.extractConnections(text);
      
      const types = connections.map(c => c.type);
      expect(types).toContain('CNPJ');
      expect(types).toContain('PROCESSO');
      
      const cnpj = connections.find(c => c.type === 'CNPJ')?.ids[0];
      expect(cnpj).toBe('12.345.678/0001-90');
    });
  });

  describe('ConfidenceScorer', () => {
    it('should decay confidence for old data', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const scoreNow = ConfidenceScorer.calculateSourceScore({
        url: 'https://g1.globo.com',
        timestamp: now,
        method: 'api'
      });

      const scoreYesterday = ConfidenceScorer.calculateSourceScore({
        url: 'https://g1.globo.com',
        timestamp: yesterday,
        method: 'api'
      });

      const scoreLastWeek = ConfidenceScorer.calculateSourceScore({
        url: 'https://g1.globo.com',
        timestamp: lastWeek,
        method: 'api'
      });

      expect(scoreNow).toBeGreaterThan(scoreYesterday);
      expect(scoreYesterday).toBeGreaterThan(scoreLastWeek);
    });

    it('should give higher reputation to official domains', () => {
      const govScore = ConfidenceScorer.calculateSourceScore({
        url: 'https://www.camara.leg.br/noticias',
        timestamp: new Date(),
        method: 'api'
      });

      const blogScore = ConfidenceScorer.calculateSourceScore({
        url: 'https://meublogpolitico.com.br',
        timestamp: new Date(),
        method: 'api'
      });

      expect(govScore).toBeGreaterThan(blogScore);
    });
  });
});
