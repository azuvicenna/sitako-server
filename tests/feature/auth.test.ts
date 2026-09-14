import request from 'supertest';
import app from '@/app';
import { librarianToken } from '../helpers/auth.helper';

// Mock seluruh controller auth agar tidak menyentuh database nyata
jest.mock('@/controllers/auth/auth.controller', () => ({
  getCaptcha: jest.fn((req, res) =>
    res.status(200).json({ success: true, data: { captcha: '<svg/>', token: 'captcha-token' } }),
  ),
  login: jest.fn((req, res) => res.status(200).json({ success: true, message: 'Login berhasil' })),
  logout: jest.fn((req, res) =>
    res.status(200).json({ success: true, message: 'Logout berhasil' }),
  ),
}));

describe('Auth Endpoints', () => {
  // ─── GET /api/auth/captcha ───────────────────────────────────────────────
  describe('GET /api/auth/captcha', () => {
    it('should return captcha data with status 200', async () => {
      const res = await request(app).get('/api/auth/captcha');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('captcha');
    });
  });

  // ─── POST /api/auth/login ────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('should return 200 with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        identifier: '1234567890',
        password: 'password123',
        captcha: 'ABCD',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when body is missing required fields', async () => {
      const res = await request(app).post('/api/auth/login').send({});

      expect(res.status).toBe(400);
    });

    it('should return 400 when identifier is empty', async () => {
      const res = await request(app).post('/api/auth/login').send({
        identifier: '',
        password: 'password123',
        captcha: 'ABCD',
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 when password is missing', async () => {
      const res = await request(app).post('/api/auth/login').send({
        identifier: '1234567890',
        captcha: 'ABCD',
      });

      expect(res.status).toBe(400);
    });
  });

  // ─── POST /api/auth/logout ───────────────────────────────────────────────
  describe('POST /api/auth/logout', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(401);
    });

    it('should return 200 with valid auth cookie', async () => {
      const token = librarianToken();

      const res = await request(app).post('/api/auth/logout').set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
