import request from 'supertest';
import app from '@/app';
import { librarianToken } from '../helpers/auth.helper';

const mockStack = {
  id: 'stack-id-001',
  rakId: 'shelf-id-001',
  bukuId: 'book-id-001',
  kdSusunan: 'A-001',
  nomorSusunan: 1,
};

jest.mock('@/controllers/librarian/stack.controller', () => ({
  getStacksHandler: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: [mockStack],
      meta: { page: 1, limit: 10, total: 1 },
    }),
  ),
  showStack: jest.fn((req, res) => res.status(200).json({ success: true, data: mockStack })),
  createStack: jest.fn((req, res) =>
    res
      .status(201)
      .json({ success: true, data: mockStack, message: 'Susunan berhasil ditambahkan' }),
  ),
  updateStack: jest.fn((req, res) =>
    res
      .status(200)
      .json({ success: true, data: mockStack, message: 'Susunan berhasil diperbarui' }),
  ),
  deleteStack: jest.fn((req, res) =>
    res.status(200).json({ success: true, message: 'Susunan berhasil dihapus' }),
  ),
}));

jest.mock('@/controllers/librarian/shelf.controller', () => ({
  getShelvesHandler: jest.fn((req, res) => res.status(200).json({ success: true, data: [] })),
  showShelf: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
  createShelf: jest.fn((req, res) => res.status(201).json({ success: true })),
  updateShelf: jest.fn((req, res) => res.status(200).json({ success: true })),
  deleteShelf: jest.fn((req, res) => res.status(200).json({ success: true })),
}));

const SHELF_ID = 'shelf-id-001';
const STACK_ID = 'stack-id-001';

describe('Stack Endpoints (Librarian)', () => {
  let token: string;

  beforeAll(() => {
    token = librarianToken();
  });

  // ─── GET /api/shelves/:shelfId/stacks ────────────────────────────────────
  describe('GET /api/shelves/:shelfId/stacks', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get(`/api/shelves/${SHELF_ID}/stacks`);
      expect(res.status).toBe(401);
    });

    it('should return list of stacks with status 200', async () => {
      const res = await request(app)
        .get(`/api/shelves/${SHELF_ID}/stacks`)
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ─── GET /api/shelves/:shelfId/stacks/detail/:id ─────────────────────────
  describe('GET /api/shelves/:shelfId/stacks/detail/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get(`/api/shelves/${SHELF_ID}/stacks/detail/${STACK_ID}`);
      expect(res.status).toBe(401);
    });

    it('should return stack detail with status 200', async () => {
      const res = await request(app)
        .get(`/api/shelves/${SHELF_ID}/stacks/detail/${STACK_ID}`)
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('kdSusunan');
    });
  });

  // ─── POST /api/shelves/:shelfId/stacks ───────────────────────────────────
  describe('POST /api/shelves/:shelfId/stacks', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).post(`/api/shelves/${SHELF_ID}/stacks`);
      expect(res.status).toBe(401);
    });

    it('should return 201 with valid data', async () => {
      const res = await request(app)
        .post(`/api/shelves/${SHELF_ID}/stacks`)
        .set('Cookie', `token=${token}`)
        .send({
          rakId: SHELF_ID,
          bukuId: 'book-id-001',
          kdSusunan: 'A-001',
          nomorSusunan: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post(`/api/shelves/${SHELF_ID}/stacks`)
        .set('Cookie', `token=${token}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ─── PUT /api/shelves/:shelfId/stacks/:id ────────────────────────────────
  describe('PUT /api/shelves/:shelfId/stacks/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).put(`/api/shelves/${SHELF_ID}/stacks/${STACK_ID}`);
      expect(res.status).toBe(401);
    });

    it('should return 200 when updating stack', async () => {
      const res = await request(app)
        .put(`/api/shelves/${SHELF_ID}/stacks/${STACK_ID}`)
        .set('Cookie', `token=${token}`)
        .send({ kdSusunan: 'A-002' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── DELETE /api/shelves/:shelfId/stacks/:id ─────────────────────────────
  describe('DELETE /api/shelves/:shelfId/stacks/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).delete(`/api/shelves/${SHELF_ID}/stacks/${STACK_ID}`);
      expect(res.status).toBe(401);
    });

    it('should return 200 when deleting stack', async () => {
      const res = await request(app)
        .delete(`/api/shelves/${SHELF_ID}/stacks/${STACK_ID}`)
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
