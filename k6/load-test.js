import http from 'k6/http';
import { check, group, sleep } from 'k6';

// Configuração do teste
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp-up: 0 → 10 usuários em 2 min
    { duration: '5m', target: 50 },   // Ramp-up: 10 → 50 usuários em 5 min
    { duration: '10m', target: 100 }, // Pico: 50 → 100 usuários em 10 min
    { duration: '5m', target: 50 },   // Ramp-down: 100 → 50 usuários em 5 min
    { duration: '2m', target: 0 },    // Ramp-down: 50 → 0 usuários em 2 min
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% das requisições < 500ms
    http_req_failed: ['rate<0.1'],                   // Taxa de erro < 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

export default function () {
  // Teste 1: Submeter análise
  group('Submit Analysis', () => {
    const payload = JSON.stringify({
      text: 'Vou construir 1000 escolas em todo o país',
      author: 'Candidato X',
      state: 'SP',
      category: 'EDUCATION',
      source: 'load_test',
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
    };

    const res = http.post(`${BASE_URL}/api/analysis`, payload, params);

    check(res, {
      'status is 201': (r) => r.status === 201,
      'response time < 2s': (r) => r.timings.duration < 2000,
      'has analysis id': (r) => r.json('id') !== undefined,
      'has probability': (r) => r.json('results.overallProbability') !== undefined,
    });

    if (res.status === 201) {
      const analysisId = res.json('id');
      sleep(1);

      // Teste 2: Obter análise
      group('Get Analysis', () => {
        const getRes = http.get(`${BASE_URL}/api/analysis/${analysisId}`, {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
          },
        });

        check(getRes, {
          'status is 200': (r) => r.status === 200,
          'response time < 500ms': (r) => r.timings.duration < 500,
          'has results': (r) => r.json('results') !== undefined,
        });
      });

      sleep(1);

      // Teste 3: Exportar análise
      group('Export Analysis', () => {
        const exportRes = http.get(
          `${BASE_URL}/api/analysis/${analysisId}/export?format=json`,
          {
            headers: {
              'Authorization': `Bearer ${AUTH_TOKEN}`,
            },
          }
        );

        check(exportRes, {
          'status is 200': (r) => r.status === 200,
          'response time < 1s': (r) => r.timings.duration < 1000,
          'has methodology': (r) => r.json('methodology') !== undefined,
        });
      });
    }
  });

  // Teste 4: Listar análises
  group('List Analyses', () => {
    const listRes = http.get(`${BASE_URL}/api/analysis?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
    });

    check(listRes, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
      'has pagination': (r) => r.json('pagination') !== undefined,
    });
  });

  // Teste 5: Obter dashboard
  group('Get Dashboard', () => {
    const dashRes = http.get(`${BASE_URL}/api/analytics`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
    });

    check(dashRes, {
      'status is 200': (r) => r.status === 200,
      'response time < 1s': (r) => r.timings.duration < 1000,
      'has stats': (r) => r.json('totalAnalyses') !== undefined,
    });
  });

  sleep(2);
}

// Função para gerar relatório
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'k6-report.json': JSON.stringify(data),
  };
}

// Função para resumo em texto
function textSummary(data, options) {
  const indent = options.indent || '';
  const summary = [];

  summary.push('\n' + '='.repeat(80));
  summary.push('K6 LOAD TEST SUMMARY');
  summary.push('='.repeat(80) + '\n');

  // Métricas principais
  if (data.metrics) {
    summary.push('HTTP Requests:');
    const httpReqs = data.metrics.http_reqs;
    if (httpReqs && httpReqs.values) {
      summary.push(`${indent}Total: ${httpReqs.values.count}`);
      summary.push(`${indent}Rate: ${httpReqs.values.rate.toFixed(2)} req/s`);
    }

    summary.push('\nHTTP Request Duration:');
    const duration = data.metrics.http_req_duration;
    if (duration && duration.values) {
      summary.push(`${indent}Avg: ${duration.values.avg.toFixed(0)}ms`);
      summary.push(`${indent}Min: ${duration.values.min.toFixed(0)}ms`);
      summary.push(`${indent}Max: ${duration.values.max.toFixed(0)}ms`);
      summary.push(`${indent}P95: ${duration.values['p(95)'].toFixed(0)}ms`);
      summary.push(`${indent}P99: ${duration.values['p(99)'].toFixed(0)}ms`);
    }

    summary.push('\nHTTP Request Failed:');
    const failed = data.metrics.http_req_failed;
    if (failed && failed.values) {
      summary.push(`${indent}Rate: ${(failed.values.rate * 100).toFixed(2)}%`);
    }

    summary.push('\nVirtual Users:');
    const vus = data.metrics.vus;
    if (vus && vus.values) {
      summary.push(`${indent}Max: ${vus.values.value}`);
    }
  }

  summary.push('\n' + '='.repeat(80) + '\n');

  return summary.join('\n');
}
