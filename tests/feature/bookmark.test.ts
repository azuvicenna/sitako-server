import request from 'supertest';
import app from '@/app';
import { memberToken } from '../helpers/auth.helper';

const mockBookmark = {
  id: 'bm-id-001',
  bukuId: 'book-id-001',
  anggotaId: 'member-id-001',
};

const mockBook = {
  id: 'book-id-001',
  judul: 'Laskar Pelangi',
  tipeBuku: 'Digital',
  urlFile: 'https://storage.example.com/books/laskar-pelangi.pdf',
};

const mockPaginatedBookmarks = {
  data: [
    {
      id: 'bm-123',
      buku: {
        id: 'bk-456',
        judul: 'Atomic Habits',
        penulis: 'James Clear',
        cover: 'cover-atomic.jpg',
        tipeBuku: 'Fisik',
        genre: ['Self-Improvement', 'Productivity'],
      },
      createdAt: '2026-09-14T10:00:00.000Z',
    },
  ],
  pagination: {
    page: 1,
    limit: 10,
    totalItems: 35,
    totalPages: 4,
    hasNext: true,
    hasPrev: false,
  },
};

const mockAvailableBooks = {
  data: [
    {
      id: 'bk-101',
      judul: 'Clean Code',
      penulis: 'Robert C. Martin',
      penerbit: 'Prentice Hall',
      isbn: '978-0132350884',
      genre: ['Technology', 'Programming'],
      tipeBuku: 'Fisik',
      tahunTerbit: 2008,
      jumlahStok: 3,
      cover: 'url-cover-cleancode.jpg',
    },
    {
      id: 'bk-102',
      judul: 'Bumi Manusia',
      penulis: 'Pramoedya Ananta Toer',
      penerbit: 'Hasta Mitra',
      isbn: '978-9799731234',
      genre: ['Historical', 'Fiction'],
      tipeBuku: 'Digital',
      tahunTerbit: 1980,
      jumlahStok: 0,
      cover: 'url-cover-bumimanusia.jpg',
      file: 'url-file-bumimanusia.pdf',
    },
  ],
  pagination: {
    page: 1,
    limit: 10,
    totalItems: 120,
    totalPages: 12,
    hasNext: true,
    hasPrev: false,
  },
};

jest.mock('@/controllers/member/library.controller', () => ({
  getAvailableBooks: jest.fn((req, res) => {
    const rawBookType = req.query.bookType ?? req.query.tipeBuku;
    if (rawBookType !== undefined && !['Fisik', 'Digital'].includes(rawBookType)) {
      return res.status(400).json({
        success: false,
        message: 'Tipe buku tidak ditemukan atau tidak valid',
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Daftar buku berhasil diambil',
      ...mockAvailableBooks,
    });
  }),
  getMyBookmarks: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      message: 'Data bookmark berhasil diambil',
      ...mockPaginatedBookmarks,
    }),
  ),
  showBook: jest.fn((req, res) => res.status(200).json({ success: true, data: mockBook })),
  readDigitalBook: jest.fn((req, res) =>
    res.status(200).json({ success: true, data: { url: mockBook.urlFile } }),
  ),
  createBookmark: jest.fn((req, res) =>
    res
      .status(201)
      .json({ success: true, data: mockBookmark, message: 'Bookmark berhasil ditambahkan' }),
  ),
  deleteBookmark: jest.fn((req, res) =>
    res.status(200).json({ success: true, message: 'Bookmark berhasil dihapus' }),
  ),
}));

describe('Member Library & Bookmark Endpoints', () => {
  let token: string;

  beforeAll(() => {
    token = memberToken();
  });

  // ─── GET /api/book ───────────────────────────────────────────────────────
  describe('GET /api/book', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/book');
      expect(res.status).toBe(401);
    });

    it('should return available books with pagination when authenticated', async () => {
      const res = await request(app)
        .get('/api/book?page=1&limit=10')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Daftar buku berhasil diambil');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toMatchObject({
        id: 'bk-101',
        judul: 'Clean Code',
        penulis: 'Robert C. Martin',
        penerbit: 'Prentice Hall',
        isbn: '978-0132350884',
        genre: ['Technology', 'Programming'],
        tipeBuku: 'Fisik',
        tahunTerbit: 2008,
        jumlahStok: 3,
        cover: 'url-cover-cleancode.jpg',
      });
      expect(res.body.data[1]).toMatchObject({
        id: 'bk-102',
        judul: 'Bumi Manusia',
        penulis: 'Pramoedya Ananta Toer',
        tipeBuku: 'Digital',
        file: 'url-file-bumimanusia.pdf',
      });
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 10,
        totalItems: 120,
        totalPages: 12,
        hasNext: true,
        hasPrev: false,
      });
    });

    it('should accept valid bookType query param', async () => {
      const res = await request(app)
        .get('/api/book?bookType=Fisik')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when bookType is invalid', async () => {
      const res = await request(app)
        .get('/api/book?bookType=Audiobook')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Tipe buku tidak ditemukan atau tidak valid');
    });
  });

  // ─── GET /api/book/bookmark ──────────────────────────────────────────────
  describe('GET /api/book/bookmark', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/book/bookmark');
      expect(res.status).toBe(401);
    });

    it('should return bookmarks with pagination when authenticated', async () => {
      const res = await request(app)
        .get('/api/book/bookmark?page=1&limit=10')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Data bookmark berhasil diambil');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toMatchObject({
        id: 'bm-123',
        buku: {
          id: 'bk-456',
          judul: 'Atomic Habits',
          penulis: 'James Clear',
          cover: 'cover-atomic.jpg',
          tipeBuku: 'Fisik',
          genre: ['Self-Improvement', 'Productivity'],
        },
        createdAt: '2026-09-14T10:00:00.000Z',
      });
      expect(res.body.pagination).toEqual({
        page: 1,
        limit: 10,
        totalItems: 35,
        totalPages: 4,
        hasNext: true,
        hasPrev: false,
      });
    });
  });

  // ─── GET /api/book/detail/:id ────────────────────────────────────────────
  describe('GET /api/book/detail/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/book/detail/book-id-001');
      expect(res.status).toBe(401);
    });

    it('should return book detail with status 200', async () => {
      const res = await request(app)
        .get('/api/book/detail/book-id-001')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('judul');
    });
  });

  // ─── GET /api/book/digital/read/:id ─────────────────────────────────────
  describe('GET /api/book/digital/read/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/book/digital/read/book-id-001');
      expect(res.status).toBe(401);
    });

    it('should return digital book URL with status 200', async () => {
      const res = await request(app)
        .get('/api/book/digital/read/book-id-001')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('url');
    });
  });

  // ─── POST /api/book/bookmark/:id ────────────────────────────────────────
  describe('POST /api/book/bookmark/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).post('/api/book/bookmark/book-id-001');
      expect(res.status).toBe(401);
    });

    it('should return 201 with valid data', async () => {
      const res = await request(app)
        .post('/api/book/bookmark/book-id-001')
        .set('Cookie', `token=${token}`)
        .send({
          bukuId: 'book-id-001',
          anggotaId: 'member-id-001',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/book/bookmark/book-id-001')
        .set('Cookie', `token=${token}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ─── DELETE /api/book/bookmark/delete/:bookmarkId ────────────────────────
  describe('DELETE /api/book/bookmark/delete/:bookmarkId', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).delete('/api/book/bookmark/delete/bm-id-001');
      expect(res.status).toBe(401);
    });

    it('should return 200 when deleting a bookmark', async () => {
      const res = await request(app)
        .delete('/api/book/bookmark/delete/bm-id-001')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
