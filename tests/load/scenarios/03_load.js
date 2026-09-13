import http from 'k6/http';
import { check, sleep } from 'k6';
import { loginAsMember, authHeaders } from '../helper/auth.js';
import { config } from '../k6.config.js';

export const options = {
  // Load test: Menguji sistem pada level traffic normal/ekspektasi
  stages: [
    { duration: '1m', target: 50 }, // Ramp-up perlahan ke 50 user selama 1 menit
    { duration: '3m', target: 50 }, // Tahan di 50 user selama 3 menit
    { duration: '1m', target: 0 },  // Ramp-down ke 0 user selama 1 menit
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'], // 95% request < 500ms
    http_req_failed: ['rate<0.05'],                 // Error rate ditoleransi maksimal 5%
  },
};

/**
 * Setup dijalankan SEKALI sebelum virtual user mulai berjalan.
 */
export function setup() {
  const auth = loginAsMember();
  if (!auth.token) {
    throw new Error('Gagal login di tahap setup load test. Pastikan server SITAKO berjalan dan kredensial valid.');
  }
  return { token: auth.token };
}

export default function (data) {
  const headers = authHeaders(data.token);

  // Variasi nomor halaman (1 - 5) untuk mensimulasikan cache hit vs cache miss di Redis
  const randomPage = Math.floor(Math.random() * 5) + 1;
  const bookType = Math.random() > 0.5 ? 'Fisik' : 'Digital';

  // 1. Browse Books dengan variasi tipe dan halaman
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

  // Simulasi think time pengguna (0.5s - 1.5s)
  sleep(Math.random() + 0.5);
}

