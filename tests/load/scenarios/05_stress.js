import http from 'k6/http';
import { check, sleep } from 'k6';
import { loginAsMember, authHeaders } from '../helper/auth.js';
import { config } from '../k6.config.js';

export const options = {
  // Stress test: Mendorong sistem melewati batas normal (sangat agresif)
  stages: [
    { duration: '2m', target: 100 }, 
    { duration: '2m', target: 200 }, 
    { duration: '2m', target: 300 }, // Mencapai 300 concurrent user
    { duration: '2m', target: 0 },   // Ramp-down
  ],
  thresholds: {
    // Thresholds SLA saat stress test: sistem mulai melambat tapi jangan sampai gagal massal
    http_req_duration: ['p(95)<2000', 'p(99)<3000'], // 95% request di bawah 2 detik
    http_req_failed: ['rate<0.10'],                 // Error rate maksimal 10% yang ditoleransi
  },
};

/**
 * Setup dijalankan SEKALI sebelum virtual user mulai berjalan.
 */
export function setup() {
  const auth = loginAsMember();
  if (!auth.token) {
    throw new Error('Gagal login di tahap setup stress test. Pastikan server SITAKO berjalan dan kredensial valid.');
  }
  return { token: auth.token };
}

export default function (data) {
  const headers = authHeaders(data.token);

  // Variasi parameter untuk menekan layer caching Redis & PostgreSQL
  const randomPage = Math.floor(Math.random() * 5) + 1;
  const bookType = Math.random() > 0.5 ? 'Fisik' : 'Digital';

  // 1. Browse Books
  const booksRes = http.get(
    `${config.BASE_URL}/books?bookType=${bookType}&page=${randomPage}&limit=10`,
    headers
  );
  check(booksRes, {
    'GET books status 200': (r) => r.status === 200,
  });

  // 2. Akses Shelves
  const shelvesRes = http.get(`${config.BASE_URL}/shelves?page=1&limit=10`, headers);
  check(shelvesRes, {
    'GET shelves status 200': (r) => r.status === 200,
  });

  // 3. Akses Fines
  const finesRes = http.get(`${config.BASE_URL}/fines?page=1&limit=10`, headers);
  check(finesRes, {
    'GET fines status 200': (r) => r.status === 200,
  });

  sleep(1);
}

