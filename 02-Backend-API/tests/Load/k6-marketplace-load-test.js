import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 50 },   // Steady load at 50 users
    { duration: '30s', target: 100 }, // Peak burst to 100 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],    // Error rate must be less than 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000/api/v1';

export default function () {
  // 1. Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });

  sleep(0.5);

  // 2. Public course catalog
  const catalogRes = http.get(`${BASE_URL}/courses`);
  check(catalogRes, {
    'catalog status is 200': (r) => r.status === 200,
  });

  sleep(1);

  // 3. Error catalog meta endpoint
  const metaRes = http.get(`${BASE_URL}/meta/error-catalog`);
  check(metaRes, {
    'meta error catalog status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
