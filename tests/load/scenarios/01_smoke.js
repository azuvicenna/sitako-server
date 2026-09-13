import http from 'k6/http';
import { check, sleep } from 'k6';
import { loginAsMember, authHeaders } from '../helper/auth.js';
import { config } from '../k6.config.js';

export const options = {
  // Smoke test: beban sangat ringan untuk memastikan sistem berjalan
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(99)<1000'], // 99% request harus di bawah 1 detik
    http_req_failed: ['rate<0.01'],    // Error rate harus di bawah 1%
  },
};

/**
 * Setup dijalankan SEKALI sebelum virtual user mulai berjalan.
 * Mengautentikasi dan meneruskan token ke seluruh VU iterasi.
 */
export function setup() {
  const auth = loginAsMember();
  if (!auth.token) {
    throw new Error('Gagal login di tahap setup smoke test. Pastikan server SITAKO berjalan dan kredensial valid.');
  }
  return { token: auth.token };
}

export default function (data) {
  const headers = authHeaders(data.token);

  // 1. Akses halaman Browse Buku Fisik
  const booksFisikRes = http.get(`${config.BASE_URL}/books?bookType=Fisik&page=1&limit=10`, headers);
  check(booksFisikRes, {
    'GET books (Fisik) status 200': (r) => r.status === 200,
  });

  // 2. Akses halaman Browse Buku Digital
  const booksDigitalRes = http.get(`${config.BASE_URL}/books?bookType=Digital&page=1&limit=10`, headers);
  check(booksDigitalRes, {
    'GET books (Digital) status 200': (r) => r.status === 200,
  });

  // 3. Akses daftar Rak Buku
  const shelvesRes = http.get(`${config.BASE_URL}/shelves?page=1&limit=10`, headers);
  check(shelvesRes, {
    'GET shelves status 200': (r) => r.status === 200,
  });

  // 4. Akses daftar Aturan Denda
  const finesRes = http.get(`${config.BASE_URL}/fines?page=1&limit=10`, headers);
  check(finesRes, {
    'GET fines status 200': (r) => r.status === 200,
  });

  sleep(1);
}

