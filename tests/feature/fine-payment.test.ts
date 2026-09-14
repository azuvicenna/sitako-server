import request from 'supertest';
import app from '@/app';
import { librarianToken } from '../helpers/auth.helper';

const mockFinePayment = {
  id: 'fp-id-001',
  pustakawanId: 'librarian-id-001',
  anggotaId: 'member-id-001',
  transaksiId: 'tx-id-001',
  hargaDenda: 1000,
  totalDenda: 5000,
  metodePembayaran: 'Tunai',
};

jest.mock('@/controllers/librarian/fine-payment.controller', () => ({
  getFinePaymentsHandler: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: [mockFinePayment],
      meta: { page: 1, limit: 10, total: 1 },
    }),
  ),
  showFinePayment: jest.fn((req, res) =>
    res.status(200).json({ success: true, data: mockFinePayment }),
  ),
  createFinePayment: jest.fn((req, res) =>
    res
      .status(201)
      .json({ success: true, data: mockFinePayment, message: 'Pembayaran denda berhasil dicatat' }),
  ),
  updateFinePayment: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: mockFinePayment,
      message: 'Pembayaran denda berhasil diperbarui',
    }),
  ),
  deleteFinePayment: jest.fn((req, res) =>
    res.status(200).json({ success: true, message: 'Pembayaran denda berhasil dihapus' }),
  ),
}));

jest.mock('@/controllers/member/fine-payment.controller', () => ({
  getFinePaymentsHandler: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: [mockFinePayment],
      meta: { page: 1, limit: 10, total: 1 },
    }),
  ),
  showFinePayment: jest.fn((req, res) =>
    res.status(200).json({ success: true, data: mockFinePayment }),
  ),
  initiatePayment: jest.fn((req, res) =>
    res.status(200).json({ success: true, message: 'Pembayaran berhasil diinisiasi' }),
  ),
}));

describe('Fine Payment Endpoints', () => {
  let token: string;

  beforeAll(() => {
    token = librarianToken();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LIBRARIAN FINE PAYMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/fine-payments (Librarian)', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/fine-payments');
      expect(res.status).toBe(401);
    });

    it('should return list of fine payments with status 200', async () => {
      const res = await request(app).get('/api/fine-payments').set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/fine-payments/detail/:id (Librarian)', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/fine-payments/detail/fp-id-001');
      expect(res.status).toBe(401);
    });

    it('should return fine payment detail with status 200', async () => {
      const res = await request(app)
        .get('/api/fine-payments/detail/fp-id-001')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('metodePembayaran');
    });
  });

  describe('POST /api/fine-payments (Librarian)', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).post('/api/fine-payments');
      expect(res.status).toBe(401);
    });

    it('should return 201 with valid data', async () => {
      const res = await request(app)
        .post('/api/fine-payments')
        .set('Cookie', `token=${token}`)
        .send({
          pustakawanId: 'librarian-id-001',
          anggotaId: 'member-id-001',
          transaksiId: 'tx-id-001',
          hargaDenda: 1000,
          totalDenda: 5000,
          metodePembayaran: 'Tunai',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/fine-payments')
        .set('Cookie', `token=${token}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/fine-payments/:id (Librarian)', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).put('/api/fine-payments/fp-id-001');
      expect(res.status).toBe(401);
    });

    it('should return 200 when updating a fine payment', async () => {
      const res = await request(app)
        .put('/api/fine-payments/fp-id-001')
        .set('Cookie', `token=${token}`)
        .send({ metodePembayaran: 'Non-Tunai' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/fine-payments/:id (Librarian)', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).delete('/api/fine-payments/fp-id-001');
      expect(res.status).toBe(401);
    });

    it('should return 200 when deleting a fine payment', async () => {
      const res = await request(app)
        .delete('/api/fine-payments/fp-id-001')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MEMBER FINE PAYMENTS (read-only)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/member/fine-payments (Member)', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/member/fine-payments');
      expect(res.status).toBe(401);
    });

    it('should return member fine payments with status 200', async () => {
      const res = await request(app)
        .get('/api/member/fine-payments')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/member/fine-payments/detail/:id (Member)', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/member/fine-payments/detail/fp-id-001');
      expect(res.status).toBe(401);
    });

    it('should return member fine payment detail with status 200', async () => {
      const res = await request(app)
        .get('/api/member/fine-payments/detail/fp-id-001')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('metodePembayaran');
    });
  });

  describe('POST /api/member/fine-payments/pay (Member)', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).post('/api/member/fine-payments/pay');
      expect(res.status).toBe(401);
    });

    it('should return 200 with valid data', async () => {
      const res = await request(app)
        .post('/api/member/fine-payments/pay')
        .set('Cookie', `token=${token}`)
        .send({
          transaksiId: 'tx-id-001',
          paymentMethodCode: 'QRIS',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/member/fine-payments/pay')
        .set('Cookie', `token=${token}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
