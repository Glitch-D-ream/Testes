import Queue from 'bull';
import { logInfo, logError } from '../core/logger.ts';

// Configuração do Redis (Railway fornece via variável de ambiente REDIS_URL)
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Opções padrão da fila
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 10000, // 10s inicial
  },
  removeOnComplete: true,
  removeOnFail: false,
};

// Inicialização das filas especializadas
export const scrapingQueue = new Queue('scraping', REDIS_URL, { defaultJobOptions });
export const processingQueue = new Queue('processing', REDIS_URL, { defaultJobOptions });
export const analysisQueue = new Queue('analysis', REDIS_URL, { defaultJobOptions });
export const deadLetterQueue = new Queue('dead-letter', REDIS_URL);

// Log de eventos globais
scrapingQueue.on('failed', (job, err) => {
  logError(`Fila [Scraping] falhou no job ${job.id}`, err);
});

processingQueue.on('failed', (job, err) => {
  logError(`Fila [Processing] falhou no job ${job.id}`, err);
});

analysisQueue.on('failed', (job, err) => {
  logError(`Fila [Analysis] falhou no job ${job.id}`, err);
});

logInfo('Sistema de Filas (Bull) inicializado com sucesso.');
