import { logInfo, logWarn, logError } from './logger.ts';

export enum CircuitState {
  CLOSED, // Funcionando normalmente
  OPEN,   // Falhando, bloqueando requisições
  HALF_OPEN // Testando se voltou ao normal
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;

  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly successThreshold: number;

  constructor(
    failureThreshold: number = 3,
    resetTimeout: number = 30000, // 30 segundos
    successThreshold: number = 2
  ) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
    this.successThreshold = successThreshold;
  }

  public async execute<T>(action: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    this.updateState();

    if (this.state === CircuitState.OPEN) {
      logWarn('[CircuitBreaker] Circuito ABERTO. Usando fallback.');
      return fallback();
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      logError(`[CircuitBreaker] Falha na execução. Circuito: ${CircuitState[this.state]}`);
      return fallback();
    }
  }

  private updateState(): void {
    if (this.state === CircuitState.OPEN) {
      const now = Date.now();
      if (now - this.lastFailureTime > this.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        logInfo('[CircuitBreaker] Circuito MEIO-ABERTO. Testando...');
      }
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.CLOSED) {
      // Decay gradual de falhas em estado normal
      this.failureCount = Math.max(0, this.failureCount - 1);
    } else {
      this.failureCount = 0;
    }
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        logInfo('[CircuitBreaker] Circuito FECHADO. Operação normal restabelecida.');
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    if (this.state === CircuitState.CLOSED && this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
      logError('[CircuitBreaker] Circuito ABERTO devido a múltiplas falhas.');
    }
  }

  public getState(): CircuitState {
    return this.state;
  }
}

// Instância global para o Supabase
export const supabaseCircuitBreaker = new CircuitBreaker();
