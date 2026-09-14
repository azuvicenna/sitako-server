import request from 'supertest';
import app from '@/app';
import { librarianToken } from '../helpers/auth.helper';

const mockProfile = {
  id: 'user-id-001',
  nama: 'Pengguna Test',
  email: 'pengguna@sekolah.sch.id',
  telepon: '08123456789',
  role: 'pustakawan',
};

jest.mock('@/controllers/profile/profile.controller', () => ({
  getMyProfile: jest.fn((req, res) => res.status(200).json({ success: true, data: mockProfile })),
  updateMyProfile: jest.fn((req, res) =>
    res
      .status(200)
      .json({ success: true, data: mockProfile, message: 'Profil berhasil diperbarui' }),
  ),
}));

describe('Profile Endpoints', () => {
  let token: string;

  beforeAll(() => {
    token = librarianToken();
  });

  // ─── GET /api/profile/me ─────────────────────────────────────────────────
  describe('GET /api/profile/me', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/profile/me');
      expect(res.status).toBe(401);
    });

    it('should return current user profile with status 200', async () => {
      const res = await request(app).get('/api/profile/me').set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('nama');
      expect(res.body.data).toHaveProperty('email');
    });
  });

  // ─── PUT /api/profile/me ─────────────────────────────────────────────────
  describe('PUT /api/profile/me', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).put('/api/profile/me');
      expect(res.status).toBe(401);
    });

    it('should return 200 when updating profile', async () => {
      const res = await request(app)
        .put('/api/profile/me')
        .set('Cookie', `token=${token}`)
        .send({ telepon: '08111222333' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
