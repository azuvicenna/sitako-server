import http from 'k6/http';
import { check } from 'k6';
import crypto from 'k6/crypto';
import { config } from '../k6.config.js';

/**
 * Menghasilkan token HMAC-SHA256 yang cocok dengan fungsi hashCaptcha di backend SITAKO.
 */
export function generateCaptchaToken(captchaText) {
  const secret = config.CAPTCHA_SECRET;
  return crypto.hmac('sha256', secret, captchaText.trim().toLowerCase(), 'hex');
}

/**
 * Mengambil nilai token JWT dari cookie response k6.
 */
export function extractToken(res) {
  if (res.cookies && res.cookies.token && res.cookies.token.length > 0) {
    return res.cookies.token[0].value;
  }
  return null;
}

/**
 * Fungsi untuk melakukan login dan mengembalikan cookie/token.
 */
export function login(identifier, password) {
  const url = `${config.BASE_URL}/auth/login`;

  const fakeCaptcha = 'bypass_k6';
  const hashedCaptcha = generateCaptchaToken(fakeCaptcha);

  const payload = JSON.stringify({
    identifier: identifier,
    password: password,
    captcha: fakeCaptcha,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      // Mengirimkan cookie captcha yang sudah di-hash HMAC-SHA256 sesuai verifikasi backend
      'Cookie': `captcha_token=${hashedCaptcha}`,
    },
  };

  const res = http.post(url, payload, params);

  const isSuccess = check(res, {
    'login berhasil (status 200)': (r) => r.status === 200,
    'mendapatkan cookie token': (r) => r.cookies && r.cookies.token !== undefined && r.cookies.token.length > 0,
  });

  const token = extractToken(res);

  return {
    res,
    token,
    success: isSuccess,
  };
}

/**
 * Helper login sebagai Member.
 */
export function loginAsMember() {
  const user = config.users.member;
  return login(user.identifier, user.password);
}

/**
 * Helper login sebagai Librarian / Pustakawan.
 */
export function loginAsLibrarian() {
  const user = config.users.librarian;
  return login(user.identifier, user.password);
}

/**
 * Helper untuk menyisipkan cookie token ke header request berikutnya.
 */
export function authHeaders(token) {
  return {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${token}`,
    },
  };
}

