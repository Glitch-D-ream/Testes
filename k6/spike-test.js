import http from 'k6/http';
import { check, group } from 'k6';

// Configuração do teste de spike
export const options = {
  stages: [
    { duration: '2m', target: 10 },    // Baseline: 10 usuários
    { duration: '1m', target: 100 },   // Spike 1: 10 → 100 usuários em 1 min
    { duration: '3m', target: 100 },   // Manter spike
    { duration: '1m', target: 10 },    // Voltar ao baseline
    { duration: '2m', target: 10 },    // Recuperação
    { duration: '1m', target: 200 },   // Spike 2: 10 → 200 usuários
    { duration: '3m', target: 200 },   // Manter spike
    { duration: '1m', target: 10 },    // Voltar ao baseline
    { duration: '2m', target: 0 },     // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.3'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

export default function () {
  group('Spike Test: Analysis Submission', () => {
    const payload = JSON.stringify({
      text: 'Promessa para teste de spike',
      author: `Candidato Spike ${Date.now()}`,
      state: 'SP',
      category: 'INFRASTRUCTURE',
      source: 'spike_test',
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
      'response time < 5s': (r) => r.timings.duration < 5000,
    });
  });

  group('Spike Test: Dashboard', () => {
    const dashRes = http.get(`${BASE_URL}/api/analytics`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
    });

    check(dashRes, {
      'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
      'response time < 3s': (r) => r.timings.duration < 3000,
    });
  });
}
