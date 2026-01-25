import { CircuitBreaker, CircuitState } from '../server/core/circuitBreaker.ts';

async function testResilience() {
  console.log('🧪 Iniciando teste de resiliência (Circuit Breaker)...');

  const breaker = new CircuitBreaker(2, 2000, 1); // 2 falhas abre, 2s reset, 1 sucesso fecha

  const action = async () => {
    throw new Error('Falha simulada');
  };

  const fallback = async () => {
    return 'Fallback executado';
  };

  console.log('1. Executando primeira falha...');
  let result = await breaker.execute(action, fallback);
  console.log(`Resultado: ${result}, Estado: ${CircuitState[breaker.getState()]}`);

  console.log('2. Executando segunda falha (deve abrir o circuito)...');
  result = await breaker.execute(action, fallback);
  console.log(`Resultado: ${result}, Estado: ${CircuitState[breaker.getState()]}`);

  console.log('3. Executando com circuito aberto (deve ir direto para fallback)...');
  result = await breaker.execute(action, fallback);
  console.log(`Resultado: ${result}, Estado: ${CircuitState[breaker.getState()]}`);

  console.log('4. Aguardando reset timeout (2.5s)...');
  await new Promise(resolve => setTimeout(resolve, 2500));

  console.log('5. Executando em estado HALF_OPEN...');
  const successAction = async () => 'Sucesso!';
  result = await breaker.execute(successAction, fallback);
  console.log(`Resultado: ${result}, Estado: ${CircuitState[breaker.getState()]}`);

  if (breaker.getState() === CircuitState.CLOSED) {
    console.log('✅ Teste de resiliência passou: Circuito fechou após sucesso.');
  } else {
    console.log('❌ Teste de resiliência falhou: Circuito não fechou.');
    process.exit(1);
  }
}

testResilience();
