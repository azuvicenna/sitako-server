import request from 'supertest';
import app from '@/app';
import { librarianToken } from '../helpers/auth.helper';

const mockFine = {
  id: 'fine-id-001',
  bukuId: 'book-id-001',
  jenisDenda: 'Terlambat',
  hargaDenda: 1000,
  metodePerhitungan: 'Akumulasi',
};

jest.mock('@/controllers/librarian/fine.controller', () => ({
  getFinesHandler: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: [mockFine],
      meta: { page: 1, limit: 10, total: 1 },
    }),
  ),
  showFine: jest.fn((req, res) => res.status(200).json({ success: true, data: mockFine })),
  createFine: jest.fn((req, res) =>
    res.status(201).json({ success: true, data: mockFine, message: 'Denda berhasil ditambahkan' }),
  ),
  updateFine: jest.fn((req, res) =>
    res.status(200).json({ success: true, data: mockFine, message: 'Denda berhasil diperbarui' }),
  ),
  deleteFine: jest.fn((req, res) =>
    res.status(200).json({ success: true, message: 'Denda berhasil dihapus' }),
  ),
}));

describe('Fine Endpoints (Librarian)', () => {
  let token: string;

  beforeAll(() => {
    token = librarianToken();
  });

  // ─── GET /api/fines ──────────────────────────────────────────────────────
  describe('GET /api/fines', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/fines');
      expect(res.status).toBe(401);
    });

    it('should return list of fines with status 200', async () => {
      const res = await request(app).get('/api/fines').set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ─── GET /api/fines/detail/:id ───────────────────────────────────────────
  describe('GET /api/fines/detail/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/fines/detail/fine-id-001');
      expect(res.status).toBe(401);
    });

    it('should return fine detail with status 200', async () => {
      const res = await request(app)
        .get('/api/fines/detail/fine-id-001')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('jenisDenda');
    });
  });

  // ─── POST /api/fines ─────────────────────────────────────────────────────
  describe('POST /api/fines', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).post('/api/fines');
      expect(res.status).toBe(401);
    });

    it('should return 201 with valid data', async () => {
      const res = await request(app).post('/api/fines').set('Cookie', `token=${token}`).send({
        bukuId: 'book-id-001',
        jenisDenda: 'Terlambat',
        hargaDenda: 1000,
        metodePerhitungan: 'Akumulasi',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app).post('/api/fines').set('Cookie', `token=${token}`).send({});

      expect(res.status).toBe(400);
    });

    it('should return 400 when hargaDenda is negative', async () => {
      const res = await request(app).post('/api/fines').set('Cookie', `token=${token}`).send({
        bukuId: 'book-id-001',
        hargaDenda: -100,
        jenisDenda: 'Terlambat',
        metodePerhitungan: 'Akumulasi',
      });

      expect(res.status).toBe(400);
    });
  });

  // ─── PUT /api/fines/:id ──────────────────────────────────────────────────
  describe('PUT /api/fines/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).put('/api/fines/fine-id-001');
      expect(res.status).toBe(401);
    });

    it('should return 200 when updating a fine', async () => {
      const res = await request(app)
        .put('/api/fines/fine-id-001')
        .set('Cookie', `token=${token}`)
        .send({ hargaDenda: 2000 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── DELETE /api/fines/:id ───────────────────────────────────────────────
  describe('DELETE /api/fines/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).delete('/api/fines/fine-id-001');
      expect(res.status).toBe(401);
    });

    it('should return 200 when deleting a fine', async () => {
      const res = await request(app)
        .delete('/api/fines/fine-id-001')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
