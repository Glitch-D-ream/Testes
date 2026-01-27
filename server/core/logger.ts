import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

// __filename e __dirname são injetados globalmente pelo esbuild no build-server.js

/**
 * Configuração de logging com Winston
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'detector-promessa-vazia' },
  transports: [
    new winston.transports.Console()
  ],
});

export default logger;

/**
 * Funções de conveniência para logging
 */
export function logInfo(message: string, meta?: Record<string, unknown>): void {
  logger.info(message, meta);
}

export function logError(message: string, error?: Error, meta?: Record<string, unknown>): void {
  logger.error(message, {
    ...meta,
    error: error?.message,
    stack: error?.stack,
  });
}

export function logWarn(message: string, meta?: Record<string, unknown>): void {
  logger.warn(message, meta);
}

export function logDebug(message: string, meta?: Record<string, unknown>): void {
  logger.debug(message, meta);
}
