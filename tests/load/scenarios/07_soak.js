import http from 'k6/http';
import { check, sleep } from 'k6';
import { loginAsMember, authHeaders } from '../helper/auth.js';
import { config } from '../k6.config.js';

// Durasi tahan (hold) dapat dikonfigurasi via variabel lingkungan SOAK_DURATION (default: 30m)
const soakDuration = __ENV.SOAK_DURATION || '30m';

export const options = {
  // Soak/Endurance test: Beban sedang dalam durasi panjang
  // Tujuan: Memeriksa kebocoran memori (memory leak), koneksi menggantung pada database pool, dan stabilitas Redis
  stages: [
    { duration: '2m', target: 30 }, // 1. Ramp-up bertahap ke 30 VU
    { duration: soakDuration, target: 30 }, // 2. Tahan di 30 VU selama durasi soak
    { duration: '2m', target: 0 }, // 3. Ramp-down kembali ke 0
  ],
  thresholds: {
    // Pada soak test, performa harus stabil dan konsisten sepanjang waktu pengujian
    http_req_duration: ['p(95)<600', 'p(99)<1500'],
    http_req_failed: ['rate<0.01'], // Error rate sangat ketat (maksimal 1%)
  },
};

/**
 * Setup dijalankan SEKALI sebelum virtual user mulai berjalan.
 */
export function setup() {
  const auth = loginAsMember();
  if (!auth.token) {
    throw new Error(
      'Gagal login di tahap setup soak test. Pastikan server SITAKO berjalan dan kredensial valid.',
    );
  }
  return { token: auth.token };
}

export default function (data) {
  const headers = authHeaders(data.token);

  const randomPage = Math.floor(Math.random() * 5) + 1;
  const bookType = Math.random() > 0.5 ? 'Fisik' : 'Digital';

  // 1. Browse Books dengan variasi tipe dan halaman
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

  // Pacing realistis (1s - 2s) untuk mensimulasikan jeda baca pengguna
  sleep(Math.random() + 1);
}
