import request from 'supertest';
import app from '@/app';
import { librarianToken } from '../helpers/auth.helper';

const mockBook = {
  id: 'book-id-001',
  judul: 'Laskar Pelangi',
  penulis: 'Andrea Hirata',
  isbn: '978-979-1495-25-8',
  penerbit: 'Bentang Pustaka',
  genre: ['Fiksi', 'Pendidikan'],
  tipeBuku: 'Fisik',
  tahunTerbit: 2005,
  jumlahStok: 5,
};

jest.mock('@/controllers/librarian/book.controller', () => ({
  getBookHandler: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: [mockBook],
      meta: { page: 1, limit: 10, total: 1 },
    }),
  ),
  showBook: jest.fn((req, res) => res.status(200).json({ success: true, data: mockBook })),
  createBook: jest.fn((req, res) =>
    res.status(201).json({ success: true, data: mockBook, message: 'Buku berhasil ditambahkan' }),
  ),
  updateBook: jest.fn((req, res) =>
    res.status(200).json({ success: true, data: mockBook, message: 'Buku berhasil diperbarui' }),
  ),
  deleteBook: jest.fn((req, res) =>
    res.status(200).json({ success: true, message: 'Buku berhasil dihapus' }),
  ),
}));

describe('Book Endpoints (Librarian)', () => {
  let token: string;

  beforeAll(() => {
    token = librarianToken();
  });

  // ─── GET /api/books ──────────────────────────────────────────────────────
  describe('GET /api/books', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/books');
      expect(res.status).toBe(401);
    });

    it('should return list of books with status 200', async () => {
      const res = await request(app).get('/api/books').set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should support pagination query params', async () => {
      const res = await request(app)
        .get('/api/books?page=1&limit=5')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
    });
  });

  // ─── GET /api/books/detail/:id ───────────────────────────────────────────
  describe('GET /api/books/detail/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/books/detail/book-id-001');
      expect(res.status).toBe(401);
    });

    it('should return book detail with status 200', async () => {
      const res = await request(app)
        .get('/api/books/detail/book-id-001')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('judul');
    });
  });

  // ─── POST /api/books ─────────────────────────────────────────────────────
  describe('POST /api/books', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).post('/api/books');
      expect(res.status).toBe(401);
    });

    it('should return 201 when creating a book with valid data', async () => {
      const res = await request(app)
        .post('/api/books')
        .set('Cookie', `token=${token}`)
        .send({
          judul: 'Laskar Pelangi',
          penulis: 'Andrea Hirata',
          isbn: '978-979-1495-25-8',
          penerbit: 'Bentang Pustaka',
          genre: ['Fiksi'],
          tipeBuku: 'Fisik',
          tahunTerbit: 2005,
          jumlahStok: 5,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app).post('/api/books').set('Cookie', `token=${token}`).send({});

      expect(res.status).toBe(400);
    });
  });

  // ─── PUT /api/books/:id ──────────────────────────────────────────────────
  describe('PUT /api/books/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).put('/api/books/book-id-001');
      expect(res.status).toBe(401);
    });

    it('should return 200 when updating a book', async () => {
      const res = await request(app)
        .put('/api/books/book-id-001')
        .set('Cookie', `token=${token}`)
        .send({ judul: 'Laskar Pelangi Updated' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── DELETE /api/books/:id ───────────────────────────────────────────────
  describe('DELETE /api/books/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).delete('/api/books/book-id-001');
      expect(res.status).toBe(401);
    });

    it('should return 200 when deleting a book', async () => {
      const res = await request(app)
        .delete('/api/books/book-id-001')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
