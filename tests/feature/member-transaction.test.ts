import request from 'supertest';
import app from '@/app';
import { memberToken } from '../helpers/auth.helper';

const mockTransaction = {
  id: 'mtx-id-001',
  bukuId: 'book-id-001',
  pustakawanId: 'librarian-id-001',
  tglPinjam: '2026-09-01',
  tglKembali: '2026-09-15',
  status: 'Menunggu Persetujuan',
};

jest.mock('@/controllers/member/transaction.controller', () => ({
  getMyTransactions: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: [mockTransaction],
      meta: { page: 1, limit: 10, total: 1 },
    }),
  ),
  showMyTransaction: jest.fn((req, res) =>
    res.status(200).json({ success: true, data: mockTransaction }),
  ),
  createMyTransaction: jest.fn((req, res) =>
    res.status(201).json({
      success: true,
      data: mockTransaction,
      message: 'Permintaan peminjaman berhasil dibuat',
    }),
  ),
  returnMyTransaction: jest.fn((req, res) =>
    res.status(200).json({ success: true, message: 'Buku berhasil dikembalikan' }),
  ),
}));

describe('Member Transaction Endpoints', () => {
  let token: string;

  beforeAll(() => {
    token = memberToken();
  });

  // ─── GET /api/member/transactions ───────────────────────────────────────
  describe('GET /api/member/transactions', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/member/transactions');
      expect(res.status).toBe(401);
    });

    it('should return my transactions with status 200', async () => {
      const res = await request(app)
        .get('/api/member/transactions')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ─── GET /api/member/transactions/detail/:id ────────────────────────────
  describe('GET /api/member/transactions/detail/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/member/transactions/detail/mtx-id-001');
      expect(res.status).toBe(401);
    });

    it('should return transaction detail with status 200', async () => {
      const res = await request(app)
        .get('/api/member/transactions/detail/mtx-id-001')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('status');
    });
  });

  // ─── POST /api/member/transactions ──────────────────────────────────────
  describe('POST /api/member/transactions', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).post('/api/member/transactions');
      expect(res.status).toBe(401);
    });

    it('should return 201 with valid data', async () => {
      const res = await request(app)
        .post('/api/member/transactions')
        .set('Cookie', `token=${token}`)
        .send({
          bukuId: 'book-id-001',
          pustakawanId: 'librarian-id-001',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/member/transactions')
        .set('Cookie', `token=${token}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ─── POST /api/member/transactions/:id/return ───────────────────────────
  describe('POST /api/member/transactions/:id/return', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).post('/api/member/transactions/mtx-id-001/return');
      expect(res.status).toBe(401);
    });

    it('should return 200 when returning a book', async () => {
      const res = await request(app)
        .post('/api/member/transactions/mtx-id-001/return')
        .set('Cookie', `token=${token}`)
        .send({ isBukuHilang: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 200 when returning a lost book', async () => {
      const res = await request(app)
        .post('/api/member/transactions/mtx-id-001/return')
        .set('Cookie', `token=${token}`)
        .send({ isBukuHilang: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
