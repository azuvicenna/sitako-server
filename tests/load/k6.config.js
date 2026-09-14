export const config = {
  // Gunakan env var untuk BASE_URL, fallback ke localhost:5000/api jika tidak ada
  BASE_URL: __ENV.BASE_URL || 'http://localhost:5000/api',

  // Secret CAPTCHA untuk verifikasi HMAC
  CAPTCHA_SECRET: __ENV.CAPTCHA_SECRET || 'captcha_default_secret',

  // Data user dummy untuk pengujian.
  // Bisa di-override lewat environment variable saat eksekusi k6
  users: {
    member: {
      identifier: __ENV.MEMBER_IDENTIFIER || '11111', // Contoh NIS
      password: __ENV.MEMBER_PASSWORD || 'password123',
    },
    librarian: {
      identifier: __ENV.LIBRARIAN_IDENTIFIER || '99999', // Contoh NIP
      password: __ENV.LIBRARIAN_PASSWORD || 'password123',
    },
  },
};
