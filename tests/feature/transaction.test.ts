import request from 'supertest';
import app from '@/app';
import { librarianToken } from '../helpers/auth.helper';

const mockTransaction = {
  id: 'tx-id-001',
  bukuId: 'book-id-001',
  pustakawanId: 'librarian-id-001',
  anggotaId: 'member-id-001',
  tglPinjam: '2026-09-01',
  tglKembali: '2026-09-15',
  status: 'Dipinjam',
};

jest.mock('@/controllers/librarian/transaction.controller', () => ({
  getTransactionsHandler: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: [mockTransaction],
      meta: { page: 1, limit: 10, total: 1 },
    }),
  ),
  showTransaction: jest.fn((req, res) =>
    res.status(200).json({ success: true, data: mockTransaction }),
  ),
  createTransaction: jest.fn((req, res) =>
    res
      .status(201)
      .json({ success: true, data: mockTransaction, message: 'Transaksi berhasil dibuat' }),
  ),
  updateTransaction: jest.fn((req, res) =>
    res
      .status(200)
      .json({ success: true, data: mockTransaction, message: 'Transaksi berhasil diperbarui' }),
  ),
  deleteTransaction: jest.fn((req, res) =>
    res.status(200).json({ success: true, message: 'Transaksi berhasil dihapus' }),
  ),
}));

describe('Transaction Endpoints (Librarian)', () => {
  let token: string;

  beforeAll(() => {
    token = librarianToken();
  });

  // ─── GET /api/transactions ───────────────────────────────────────────────
  describe('GET /api/transactions', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/transactions');
      expect(res.status).toBe(401);
    });

    it('should return list of transactions with status 200', async () => {
      const res = await request(app).get('/api/transactions').set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ─── GET /api/transactions/detail/:id ────────────────────────────────────
  describe('GET /api/transactions/detail/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/transactions/detail/tx-id-001');
      expect(res.status).toBe(401);
    });

    it('should return transaction detail with status 200', async () => {
      const res = await request(app)
        .get('/api/transactions/detail/tx-id-001')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('status');
    });
  });

  // ─── POST /api/transactions ──────────────────────────────────────────────
  describe('POST /api/transactions', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).post('/api/transactions');
      expect(res.status).toBe(401);
    });

    it('should return 201 with valid data', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Cookie', `token=${token}`)
        .send({
          bukuId: 'book-id-001',
          pustakawanId: 'librarian-id-001',
          anggotaId: 'member-id-001',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Cookie', `token=${token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 400 when bukuId is missing', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Cookie', `token=${token}`)
        .send({
          pustakawanId: 'librarian-id-001',
          anggotaId: 'member-id-001',
        });

      expect(res.status).toBe(400);
    });
  });

  // ─── PUT /api/transactions/:id ───────────────────────────────────────────
  describe('PUT /api/transactions/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).put('/api/transactions/tx-id-001');
      expect(res.status).toBe(401);
    });

    it('should return 200 when updating a transaction', async () => {
      const res = await request(app)
        .put('/api/transactions/tx-id-001')
        .set('Cookie', `token=${token}`)
        .send({ status: 'Dikembalikan' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── DELETE /api/transactions/:id ────────────────────────────────────────
  describe('DELETE /api/transactions/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).delete('/api/transactions/tx-id-001');
      expect(res.status).toBe(401);
    });

    it('should return 200 when deleting a transaction', async () => {
      const res = await request(app)
        .delete('/api/transactions/tx-id-001')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
