
import { logWarn, logInfo } from './logger.ts';

export type BreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface BreakerStatus {
  state: BreakerState;
  failures: number;
  lastFailure: number;
}

/**
 * CircuitBreaker
 * Protege o sistema contra falhas em cascata de serviços externos.
 */
export class CircuitBreaker {
  private static states = new Map<string, BreakerStatus>();
  private static readonly FAILURE_THRESHOLD = 5;
  private static readonly RESET_TIMEOUT = 30000; // 30 segundos

  private static getBreaker(service: string): BreakerStatus {
    if (!this.states.has(service)) {
      this.states.set(service, { state: 'CLOSED', failures: 0, lastFailure: 0 });
    }
    return this.states.get(service)!;
  }

  /**
   * Executa uma operação com proteção de Circuit Breaker
   */
  static async call<T>(
    service: string,
    operation: () => Promise<T>,
    fallback: () => Promise<T>
  ): Promise<T> {
    const breaker = this.getBreaker(service);

    if (breaker.state === 'OPEN') {
      const now = Date.now();
      if (now - breaker.lastFailure > this.RESET_TIMEOUT) {
        logInfo(`[CircuitBreaker] Tentando HALF_OPEN para o serviço: ${service}`);
        breaker.state = 'HALF_OPEN';
      } else {
        logWarn(`[CircuitBreaker] Circuito ABERTO para ${service}. Usando fallback.`);
        return fallback();
      }
    }

    try {
      const result = await operation();
      
      // Se tiver sucesso em HALF_OPEN, fecha o circuito
      if (breaker.state === 'HALF_OPEN') {
        logInfo(`[CircuitBreaker] Sucesso em HALF_OPEN. Fechando circuito para ${service}.`);
        breaker.state = 'CLOSED';
        breaker.failures = 0;
      }
      
      return result;
    } catch (error) {
      breaker.failures++;
      breaker.lastFailure = Date.now();
      
      logWarn(`[CircuitBreaker] Falha no serviço ${service} (${breaker.failures}/${this.FAILURE_THRESHOLD})`);

      if (breaker.failures >= this.FAILURE_THRESHOLD) {
        logWarn(`[CircuitBreaker] Limite atingido. ABRINDO circuito para ${service}.`);
        breaker.state = 'OPEN';
      }

      return fallback();
    }
  }

  static getStatus() {
    return Array.from(this.states.entries()).map(([service, status]) => ({
      service,
      ...status
    }));
  }
}
