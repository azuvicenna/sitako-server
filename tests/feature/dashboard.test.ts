import request from 'supertest';
import app from '@/app';
import { librarianToken } from '../helpers/auth.helper';

jest.mock('@/controllers/librarian/dashboard.controller', () => ({
  getSummary: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: {
        totalBuku: 120,
        totalAnggota: 45,
        totalPustakawan: 3,
        totalTransaksi: 200,
      },
    }),
  ),
  getTodayTransactions: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: [],
      meta: { page: 1, limit: 10, total: 0 },
    }),
  ),
  getWeeklyStatistics: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: [],
    }),
  ),
}));

describe('Dashboard Endpoints', () => {
  let token: string;

  beforeAll(() => {
    token = librarianToken();
  });

  // ─── GET /api/dashboard/summary ─────────────────────────────────────────
  describe('GET /api/dashboard/summary', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/dashboard/summary');
      expect(res.status).toBe(401);
    });

    it('should return summary data with status 200', async () => {
      const res = await request(app).get('/api/dashboard/summary').set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalBuku');
      expect(res.body.data).toHaveProperty('totalAnggota');
    });
  });

  // ─── GET /api/dashboard/transaction/today ───────────────────────────────
  describe('GET /api/dashboard/transaction/today', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/dashboard/transaction/today');
      expect(res.status).toBe(401);
    });

    it('should return today transactions with status 200', async () => {
      const res = await request(app)
        .get('/api/dashboard/transaction/today')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('data');
    });
  });

  // ─── GET /api/dashboard/statistics ──────────────────────────────────────
  describe('GET /api/dashboard/statistics', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/dashboard/statistics');
      expect(res.status).toBe(401);
    });

    it('should return weekly statistics with status 200', async () => {
      const res = await request(app)
        .get('/api/dashboard/statistics')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
