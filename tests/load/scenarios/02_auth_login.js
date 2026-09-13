import { check, sleep } from 'k6';
import { login } from '../helper/auth.js';
import { config } from '../k6.config.js';

export const options = {
  // Pengujian khusus endpoint autentikasi (POST /api/auth/login).
  // Karena login memicu bcrypt.compare (CPU-intensive), stages diatur bertahap
  // untuk mengetahui batas throughput worker threadpool Node.js.
  stages: [
    { duration: '30s', target: 10 }, // Pemanasan 10 user login bersamaan
    { duration: '1m', target: 30 },  // Beban sedang: 30 user login
    { duration: '1m', target: 50 },  // Beban tinggi: 50 user login bersamaan
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    // Bcrypt membutuhkan waktu komputasi (50-200ms per request),
    // sehingga batas p95 diberikan toleransi realistis di bawah 1.5 detik
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.05'], // Error rate di bawah 5%
  },
};

export default function () {
  // Bergantian antara user Member dan Librarian
  const isMember = Math.random() > 0.5;
  const credentials = isMember ? config.users.member : config.users.librarian;

  const result = login(credentials.identifier, credentials.password);

  check(result.res, {
    'login status 200': (r) => r.status === 200,
    'token cookie exists': () => result.token !== null && result.token.length > 0,
  });

  // Jeda realistis antar percobaan login
  sleep(1);
}
