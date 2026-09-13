import http from 'k6/http';
import { check, sleep } from 'k6';
import { loginAsLibrarian, authHeaders } from '../helper/auth.js';
import { config } from '../k6.config.js';

export const options = {
  // Write Lifecycle test: Menguji performa penulisan ke database PostgreSQL (Write Path)
  // Menjalankan siklus CRUD lengkap: INSERT -> READ DETAIL -> UPDATE -> DELETE (Cleanup).
  // Tanpa menyentuh Cloudflare R2 dan tanpa menembak Tripay eksternal.
  stages: [
    { duration: '30s', target: 10 }, // Ramp-up ke 10 VU
    { duration: '1m', target: 20 },  // Beban konstan 20 VU (menghasilkan ribuan write operations)
    { duration: '30s', target: 0 },  // Ramp-down
  ],
  thresholds: {
    // Operasi penulisan (INSERT/UPDATE/DELETE) melibatkan ACID transaction PostgreSQL,
    // sehingga batas p95 diberikan batas wajar di bawah 1 detik.
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.02'], // Toleransi kegagalan maksimal 2%
  },
};

/**
 * Setup dijalankan SEKALI sebelum virtual user mulai berjalan.
 */
export function setup() {
  const auth = loginAsLibrarian();
  if (!auth.token) {
    throw new Error('Gagal login sebagai Librarian di tahap setup write lifecycle test.');
  }
  return { token: auth.token };
}

export default function (data) {
  const headers = authHeaders(data.token);

  // Penamaan unik agar tidak bentrok antar VU dan iterasi
  const uniqueName = `Rak_K6_${__VU}_${__ITER}_${Date.now()}`;

  // 1. [CREATE] Menambahkan Rak Buku baru (INSERT ke PostgreSQL)
  const createPayload = JSON.stringify({ namaRak: uniqueName });
  const createRes = http.post(`${config.BASE_URL}/shelves`, createPayload, headers);

  const isCreated = check(createRes, {
    'POST shelf (INSERT) status 200': (r) => r.status === 200,
    'POST shelf data.id exists': (r) => {
      try {
        return r.json().data && r.json().data.id !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (isCreated) {
    const shelfId = createRes.json().data.id;

    // 2. [READ DETAIL] Membaca data rak spesifik yang baru dibuat
    const detailRes = http.get(`${config.BASE_URL}/shelves/detail/${shelfId}`, headers);
    check(detailRes, {
      'GET shelf detail status 200': (r) => r.status === 200,
    });

    // 3. [UPDATE] Memperbarui nama rak (UPDATE ke PostgreSQL)
    const updatePayload = JSON.stringify({ namaRak: `${uniqueName}_Updated` });
    const updateRes = http.put(`${config.BASE_URL}/shelves/${shelfId}`, updatePayload, headers);
    check(updateRes, {
      'PUT shelf (UPDATE) status 200': (r) => r.status === 200,
    });

    // 4. [DELETE] Menghapus kembali rak dari PostgreSQL (Auto-Cleanup)
    const deleteRes = http.del(`${config.BASE_URL}/shelves/${shelfId}`, null, headers);
    check(deleteRes, {
      'DELETE shelf (CLEANUP) status 200': (r) => r.status === 200,
    });
  }

  // Jeda realistis antar siklus write
  sleep(1);
}
