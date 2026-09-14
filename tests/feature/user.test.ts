import request from 'supertest';
import app from '@/app';
import { librarianToken } from '../helpers/auth.helper';

const mockLibrarian = {
  id: 'librarian-id-001',
  nama: 'Budi Santoso',
  nip: '199001010001',
  email: 'budi@sekolah.sch.id',
  telepon: '08123456789',
  status_aktif: true,
};

const mockMember = {
  id: 'member-id-001',
  nama: 'Ani Rahayu',
  nis: '2024001',
  email: 'ani@siswa.sch.id',
  telepon: '08198765432',
  status_aktif: true,
};

jest.mock('@/controllers/librarian/librarian.controller', () => ({
  getLibrarianHandler: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: [mockLibrarian],
      meta: { page: 1, limit: 10, total: 1 },
    }),
  ),
  showLibrarian: jest.fn((req, res) =>
    res.status(200).json({ success: true, data: mockLibrarian }),
  ),
  createLibrarian: jest.fn((req, res) =>
    res
      .status(201)
      .json({ success: true, data: mockLibrarian, message: 'Pustakawan berhasil ditambahkan' }),
  ),
  updateLibrarian: jest.fn((req, res) =>
    res
      .status(200)
      .json({ success: true, data: mockLibrarian, message: 'Pustakawan berhasil diperbarui' }),
  ),
  deleteLibrarian: jest.fn((req, res) =>
    res.status(200).json({ success: true, message: 'Pustakawan berhasil dihapus' }),
  ),
}));

jest.mock('@/controllers/librarian/member.controller', () => ({
  getMemberHandler: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      data: [mockMember],
      meta: { page: 1, limit: 10, total: 1 },
    }),
  ),
  showMember: jest.fn((req, res) => res.status(200).json({ success: true, data: mockMember })),
  createMember: jest.fn((req, res) =>
    res
      .status(201)
      .json({ success: true, data: mockMember, message: 'Anggota berhasil ditambahkan' }),
  ),
  updateMember: jest.fn((req, res) =>
    res
      .status(200)
      .json({ success: true, data: mockMember, message: 'Anggota berhasil diperbarui' }),
  ),
  deleteMember: jest.fn((req, res) =>
    res.status(200).json({ success: true, message: 'Anggota berhasil dihapus' }),
  ),
}));

describe('User Endpoints (Librarian)', () => {
  let token: string;

  beforeAll(() => {
    token = librarianToken();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LIBRARIAN CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/user/librarians', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/user/librarians');
      expect(res.status).toBe(401);
    });

    it('should return list of librarians with status 200', async () => {
      const res = await request(app).get('/api/user/librarians').set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/user/librarians/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/user/librarians/librarian-id-001');
      expect(res.status).toBe(401);
    });

    it('should return librarian detail with status 200', async () => {
      const res = await request(app)
        .get('/api/user/librarians/librarian-id-001')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('nip');
    });
  });

  describe('POST /api/user/librarians', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).post('/api/user/librarians');
      expect(res.status).toBe(401);
    });

    it('should return 201 with valid data', async () => {
      const res = await request(app)
        .post('/api/user/librarians')
        .set('Cookie', `token=${token}`)
        .send({
          nama: 'Budi Santoso',
          nip: '199001010001',
          email: 'budi@sekolah.sch.id',
          password: 'password123',
          telepon: '08123456789',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/user/librarians')
        .set('Cookie', `token=${token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 400 when email format is invalid', async () => {
      const res = await request(app)
        .post('/api/user/librarians')
        .set('Cookie', `token=${token}`)
        .send({
          nama: 'Budi',
          nip: '199001010001',
          email: 'bukan-email',
          password: 'password123',
          telepon: '08123456789',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/user/librarians/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).put('/api/user/librarians/librarian-id-001');
      expect(res.status).toBe(401);
    });

    it('should return 200 when updating a librarian', async () => {
      const res = await request(app)
        .put('/api/user/librarians/librarian-id-001')
        .set('Cookie', `token=${token}`)
        .send({ nama: 'Budi Santoso Updated' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/user/librarians/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).delete('/api/user/librarians/librarian-id-001');
      expect(res.status).toBe(401);
    });

    it('should return 200 when deleting a librarian', async () => {
      const res = await request(app)
        .delete('/api/user/librarians/librarian-id-001')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MEMBER CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/user/members', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/user/members');
      expect(res.status).toBe(401);
    });

    it('should return list of members with status 200', async () => {
      const res = await request(app).get('/api/user/members').set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/user/members/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/user/members/member-id-001');
      expect(res.status).toBe(401);
    });

    it('should return member detail with status 200', async () => {
      const res = await request(app)
        .get('/api/user/members/member-id-001')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('nis');
    });
  });

  describe('POST /api/user/members', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).post('/api/user/members');
      expect(res.status).toBe(401);
    });

    it('should return 201 with valid data', async () => {
      const res = await request(app)
        .post('/api/user/members')
        .set('Cookie', `token=${token}`)
        .send({
          nama: 'Ani Rahayu',
          nis: '2024001',
          email: 'ani@siswa.sch.id',
          password: 'password123',
          telepon: '08198765432',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/user/members')
        .set('Cookie', `token=${token}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/user/members/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).put('/api/user/members/member-id-001');
      expect(res.status).toBe(401);
    });

    it('should return 200 when updating a member', async () => {
      const res = await request(app)
        .put('/api/user/members/member-id-001')
        .set('Cookie', `token=${token}`)
        .send({ nama: 'Ani Updated' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/user/members/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).delete('/api/user/members/member-id-001');
      expect(res.status).toBe(401);
    });

    it('should return 200 when deleting a member', async () => {
      const res = await request(app)
        .delete('/api/user/members/member-id-001')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
