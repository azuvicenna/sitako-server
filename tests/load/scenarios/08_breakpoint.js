import http from 'k6/http';
import { check, sleep } from 'k6';
import { loginAsMember, authHeaders } from '../helper/auth.js';
import { config } from '../k6.config.js';

export const options = {
  // Breakpoint test: Menemukan kapasitas maksimum sistem sesungguhnya.
  // Beban dinaikkan terus-menerus hingga sistem mengalami kegagalan (breakpoint).
  stages: [
    { duration: '1m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '1m', target: 200 },
    { duration: '1m', target: 300 },
    { duration: '1m', target: 400 },
    { duration: '1m', target: 500 },
    { duration: '1m', target: 600 },
    { duration: '1m', target: 800 },
    { duration: '1m', target: 1000 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    // abortOnFail: true akan menghentikan tes seketika saat sistem menyerah,
    // sehingga Anda langsung mengetahui pada RPS dan VU berapa titik jenuhnya.
    http_req_duration: [{ threshold: 'p(95)<5000', abortOnFail: true, delayAbortEval: '10s' }],
    http_req_failed: [{ threshold: 'rate<0.20', abortOnFail: true, delayAbortEval: '10s' }],
  },
};

/**
 * Setup dijalankan SEKALI sebelum virtual user mulai berjalan.
 */
export function setup() {
  const auth = loginAsMember();
  if (!auth.token) {
    throw new Error(
      'Gagal login di tahap setup breakpoint test. Pastikan server SITAKO berjalan dan kredensial valid.',
    );
  }
  return { token: auth.token };
}

export default function (data) {
  const headers = authHeaders(data.token);

  const randomPage = Math.floor(Math.random() * 5) + 1;
  const bookType = Math.random() > 0.5 ? 'Fisik' : 'Digital';

  // 1. Browse Books
  const booksRes = http.get(
    `${config.BASE_URL}/books?bookType=${bookType}&page=${randomPage}&limit=10`,
    headers,
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

  sleep(0.5);
}
