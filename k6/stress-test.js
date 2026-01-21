import http from 'k6/http';
import { check, group } from 'k6';

// Configuração do teste de stress
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp-up rápido: 0 → 100 usuários
    { duration: '5m', target: 200 },   // Aumentar: 100 → 200 usuários
    { duration: '5m', target: 300 },   // Aumentar: 200 → 300 usuários
    { duration: '5m', target: 400 },   // Stress: 300 → 400 usuários
    { duration: '5m', target: 500 },   // Stress máximo: 400 → 500 usuários
    { duration: '5m', target: 300 },   // Ramp-down: 500 → 300 usuários
    { duration: '3m', target: 0 },     // Ramp-down: 300 → 0 usuários
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'], // Mais lenient que load test
    http_req_failed: ['rate<0.2'],                    // Taxa de erro < 20%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

export default function () {
  // Teste intensivo de submissão
  group('Stress: Submit Analysis', () => {
    const payload = JSON.stringify({
      text: 'Promessa de teste para stress test',
      author: `Candidato ${Math.random()}`,
      state: ['SP', 'RJ', 'MG', 'BA', 'RS'][Math.floor(Math.random() * 5)],
      category: ['EDUCATION', 'HEALTH', 'INFRASTRUCTURE', 'EMPLOYMENT'][Math.floor(Math.random() * 4)],
      source: 'stress_test',
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
    };

    const res = http.post(`${BASE_URL}/api/analysis`, payload, params);

    check(res, {
      'status is 201 or 429': (r) => r.status === 201 || r.status === 429,
      'response time < 3s': (r) => r.timings.duration < 3000,
    });
  });

  // Teste de leitura sob stress
  group('Stress: Read Operations', () => {
    const listRes = http.get(`${BASE_URL}/api/analysis?page=1&limit=50`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
    });

    check(listRes, {
      'status is 200': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < 2000,
    });

    const dashRes = http.get(`${BASE_URL}/api/analytics`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
    });

    check(dashRes, {
      'status is 200': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < 2000,
    });
  });

  // Teste de sincronização
  group('Stress: Sync Operations', () => {
    const syncRes = http.post(`${BASE_URL}/api/sync`, JSON.stringify({ source: 'portal' }), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
    });

    check(syncRes, {
      'status is 202 or 429': (r) => r.status === 202 || r.status === 429,
    });
  });
}
