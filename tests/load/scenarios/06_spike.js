import http from 'k6/http';
import { check, sleep } from 'k6';
import { loginAsMember, authHeaders } from '../helper/auth.js';
import { config } from '../k6.config.js';

export const options = {
  // Spike test: Menguji ketahanan sistem terhadap lonjakan traffic drastis dan mendadak
  // Contoh kasus: Ratusan siswa serentak membuka katalog perpustakaan saat jam istirahat sekolah
  stages: [
    { duration: '10s', target: 10 },  // 1. Pemanasan singkat
    { duration: '10s', target: 250 }, // 2. Lonjakan mendadak (Spike) ke 250 concurrent users
    { duration: '1m', target: 250 },  // 3. Tahan beban puncak
    { duration: '10s', target: 10 },  // 4. Penurunan tajam (Recovery phase)
    { duration: '1m', target: 10 },   // 5. Stabilisasi untuk melihat apakah server pulih
    { duration: '10s', target: 0 },   // 6. Ramp-down selesai
  ],
  thresholds: {
    // Selama fase lonjakan ekstrem, latensi diizinkan naik tapi tidak boleh crash total
    http_req_duration: ['p(95)<3000', 'p(99)<5000'],
    http_req_failed: ['rate<0.15'], // Toleransi kegagalan maksimal 15% saat beban puncak
  },
};

/**
 * Setup dijalankan SEKALI sebelum virtual user mulai berjalan.
 */
export function setup() {
  const auth = loginAsMember();
  if (!auth.token) {
    throw new Error('Gagal login di tahap setup spike test. Pastikan server SITAKO berjalan dan kredensial valid.');
  }
  return { token: auth.token };
}

export default function (data) {
  const headers = authHeaders(data.token);

  const randomPage = Math.floor(Math.random() * 5) + 1;
  const bookType = Math.random() > 0.5 ? 'Fisik' : 'Digital';

  // 1. Akses Katalog Buku
  const booksRes = http.get(
    `${config.BASE_URL}/books?bookType=${bookType}&page=${randomPage}&limit=10`,
    headers
  );
  check(booksRes, {
    'GET books status 200': (r) => r.status === 200,
  });

  // 2. Akses Daftar Rak Buku
  const shelvesRes = http.get(`${config.BASE_URL}/shelves?page=1&limit=10`, headers);
  check(shelvesRes, {
    'GET shelves status 200': (r) => r.status === 200,
  });

  // Jeda singkat antar request pengguna
  sleep(1);
}
