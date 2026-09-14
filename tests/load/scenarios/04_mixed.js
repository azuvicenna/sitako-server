import http from 'k6/http';
import { check, sleep } from 'k6';
import { loginAsMember, loginAsLibrarian, authHeaders } from '../helper/auth.js';
import { config } from '../k6.config.js';

export const options = {
  // Mixed Scenario: Mensimulasikan pola traffic dunia nyata secara multi-role
  // Distribusi beban:
  // - 70% Member: Browse katalog buku Fisik & Digital (pencarian utama pengguna)
  // - 20% Member: Cek lokasi rak buku dan informasi denda
  // - 10% Librarian: Monitoring dashboard dan statistik agregasi perpustakaan
  scenarios: {
    // Skenario 1: 70% traffic (35 VU pada beban puncak)
    member_browse_books: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 35 },
        { duration: '3m', target: 35 },
        { duration: '1m', target: 0 },
      ],
      exec: 'browseBooksScenario',
    },

    // Skenario 2: 20% traffic (10 VU pada beban puncak)
    member_browse_shelves_fines: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 10 },
        { duration: '3m', target: 10 },
        { duration: '1m', target: 0 },
      ],
      exec: 'browseShelvesFinesScenario',
    },

    // Skenario 3: 10% traffic (5 VU pada beban puncak)
    librarian_monitoring: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 5 },
        { duration: '3m', target: 5 },
        { duration: '1m', target: 0 },
      ],
      exec: 'librarianMonitoringScenario',
    },
  },

  thresholds: {
    // Global threshold
    http_req_failed: ['rate<0.05'], // Toleransi kegagalan maksimal 5%

    // Threshold spesifik per skenario
    'http_req_duration{scenario:member_browse_books}': ['p(95)<800'],
    'http_req_duration{scenario:member_browse_shelves_fines}': ['p(95)<600'],
    // Query agregasi dashboard pustakawan lebih kompleks, toleransi latensi p95 hingga 1.5 detik
    'http_req_duration{scenario:librarian_monitoring}': ['p(95)<1500'],
  },
};

/**
 * Setup mengautentikasi kedua role (Member & Librarian) sebelum seluruh skenario dimulai.
 */
export function setup() {
  const memberAuth = loginAsMember();
  const librarianAuth = loginAsLibrarian();

  if (!memberAuth.token) {
    throw new Error('Gagal login sebagai Member pada setup mixed scenario.');
  }
  if (!librarianAuth.token) {
    throw new Error('Gagal login sebagai Librarian pada setup mixed scenario.');
  }

  return {
    memberToken: memberAuth.token,
    librarianToken: librarianAuth.token,
  };
}

/**
 * Eksekutor Skenario 1: Member menjelajahi katalog buku
 */
export function browseBooksScenario(data) {
  const headers = authHeaders(data.memberToken);
  const randomPage = Math.floor(Math.random() * 5) + 1;
  const bookType = Math.random() > 0.5 ? 'Fisik' : 'Digital';

  const res = http.get(
    `${config.BASE_URL}/books?bookType=${bookType}&page=${randomPage}&limit=10`,
    headers,
  );

  check(res, {
    '[Member] GET books 200': (r) => r.status === 200,
  });

  sleep(Math.random() + 0.5);
}

/**
 * Eksekutor Skenario 2: Member melihat rak buku dan aturan denda
 */
export function browseShelvesFinesScenario(data) {
  const headers = authHeaders(data.memberToken);

  const isShelf = Math.random() > 0.5;
  const url = isShelf
    ? `${config.BASE_URL}/shelves?page=1&limit=10`
    : `${config.BASE_URL}/fines?page=1&limit=10`;

  const res = http.get(url, headers);

  check(res, {
    '[Member] GET shelves/fines 200': (r) => r.status === 200,
  });

  sleep(Math.random() + 1);
}

/**
 * Eksekutor Skenario 3: Pustakawan memantau dashboard & statistik
 */
export function librarianMonitoringScenario(data) {
  const headers = authHeaders(data.librarianToken);

  // 1. Ambil data ringkasan dashboard
  const summaryRes = http.get(`${config.BASE_URL}/dashboard/summary`, headers);
  check(summaryRes, {
    '[Librarian] GET dashboard summary 200': (r) => r.status === 200,
  });

  // 2. Ambil data statistik mingguan
  const statsRes = http.get(`${config.BASE_URL}/dashboard/statistics`, headers);
  check(statsRes, {
    '[Librarian] GET dashboard statistics 200': (r) => r.status === 200,
  });

  // Pustakawan melihat dashboard dengan interval lebih santai
  sleep(2);
}
