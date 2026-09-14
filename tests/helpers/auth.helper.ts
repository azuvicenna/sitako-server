import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

/**
 * Generate JWT token untuk dipakai dalam test sebagai cookie `token`.
 */
export const generateToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
};

/**
 * Payload & token Pustakawan (Librarian) untuk digunakan pada test endpoint librarian.
 */
export const librarianPayload = {
  id: 'librarian-test-id-001',
  nama: 'Pustakawan Test',
  role: 'pustakawan',
};

export const librarianToken = (): string => generateToken(librarianPayload);

/**
 * Payload & token Anggota (Member) untuk digunakan pada test endpoint member.
 */
export const memberPayload = {
  id: 'member-test-id-001',
  nama: 'Anggota Test',
  role: 'anggota',
};

export const memberToken = (): string => generateToken(memberPayload);
