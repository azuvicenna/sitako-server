import request from 'supertest';
import app from '@/app';
import { librarianToken } from '../helpers/auth.helper';

const mockShelf = {
  id: 'shelf-id-001',
  namaRak: 'Rak A',
};

jest.mock('@/controllers/librarian/shelf.controller', () => ({
  getShelvesHandler: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: [mockShelf],
      meta: { page: 1, limit: 10, total: 1 },
    }),
  ),
  showShelf: jest.fn((req, res) => res.status(200).json({ success: true, data: mockShelf })),
  createShelf: jest.fn((req, res) =>
    res.status(201).json({ success: true, data: mockShelf, message: 'Rak berhasil ditambahkan' }),
  ),
  updateShelf: jest.fn((req, res) =>
    res.status(200).json({ success: true, data: mockShelf, message: 'Rak berhasil diperbarui' }),
  ),
  deleteShelf: jest.fn((req, res) =>
    res.status(200).json({ success: true, message: 'Rak berhasil dihapus' }),
  ),
}));

jest.mock('@/controllers/librarian/stack.controller', () => ({
  getStacksHandler: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: [],
      meta: { page: 1, limit: 10, total: 0 },
    }),
  ),
  showStack: jest.fn((req, res) =>
    res.status(200).json({ success: true, data: { id: 'stack-id-001', rakId: 'shelf-id-001' } }),
  ),
  createStack: jest.fn((req, res) =>
    res.status(201).json({ success: true, message: 'Susunan berhasil ditambahkan' }),
  ),
  updateStack: jest.fn((req, res) =>
    res.status(200).json({ success: true, message: 'Susunan berhasil diperbarui' }),
  ),
  deleteStack: jest.fn((req, res) =>
    res.status(200).json({ success: true, message: 'Susunan berhasil dihapus' }),
  ),
}));

describe('Shelf Endpoints (Librarian)', () => {
  let token: string;

  beforeAll(() => {
    token = librarianToken();
  });

  // ─── GET /api/shelves ────────────────────────────────────────────────────
  describe('GET /api/shelves', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/shelves');
      expect(res.status).toBe(401);
    });

    it('should return list of shelves with status 200', async () => {
      const res = await request(app).get('/api/shelves').set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ─── GET /api/shelves/detail/:id ────────────────────────────────────────
  describe('GET /api/shelves/detail/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/shelves/detail/shelf-id-001');
      expect(res.status).toBe(401);
    });

    it('should return shelf detail with status 200', async () => {
      const res = await request(app)
        .get('/api/shelves/detail/shelf-id-001')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('namaRak');
    });
  });

  // ─── POST /api/shelves ───────────────────────────────────────────────────
  describe('POST /api/shelves', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).post('/api/shelves');
      expect(res.status).toBe(401);
    });

    it('should return 201 with valid data', async () => {
      const res = await request(app)
        .post('/api/shelves')
        .set('Cookie', `token=${token}`)
        .send({ namaRak: 'Rak B' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when namaRak is missing', async () => {
      const res = await request(app).post('/api/shelves').set('Cookie', `token=${token}`).send({});

      expect(res.status).toBe(400);
    });
  });

  // ─── PUT /api/shelves/:id ────────────────────────────────────────────────
  describe('PUT /api/shelves/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).put('/api/shelves/shelf-id-001');
      expect(res.status).toBe(401);
    });

    it('should return 200 when updating a shelf', async () => {
      const res = await request(app)
        .put('/api/shelves/shelf-id-001')
        .set('Cookie', `token=${token}`)
        .send({ namaRak: 'Rak A Updated' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── DELETE /api/shelves/:id ─────────────────────────────────────────────
  describe('DELETE /api/shelves/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).delete('/api/shelves/shelf-id-001');
      expect(res.status).toBe(401);
    });

    it('should return 200 when deleting a shelf', async () => {
      const res = await request(app)
        .delete('/api/shelves/shelf-id-001')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
