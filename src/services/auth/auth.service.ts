import bcrypt from 'bcrypt';
import { findLibrarianByNip, findMemberByNis } from '@/repositories/auth/auth.repository';
import type { LibrarianSelect } from '@/repositories/librarian/librarian.repository';
import type { MemberSelect } from '@/repositories/librarian/member.repository';
import { generateToken } from '@/utils/auth/jwt';

export type SafeUser = Omit<LibrarianSelect | MemberSelect, 'password'>;

export interface AuthResponse {
  user: SafeUser;
  token: string;
}

export const authenticateUser = async (
  identifier: string,
  pass: string,
): Promise<AuthResponse | null> => {
  const librarian = await findLibrarianByNip(identifier);
  const rawUser = librarian ?? (await findMemberByNis(identifier));

  if (!rawUser) return null;

  const isValid = await bcrypt.compare(pass, rawUser.password);
  if (!isValid) return null;

  const role = librarian ? 'Pustakawan' : 'Anggota';
  const token = generateToken({ id: rawUser.id, role });

  const { password: _, ...user } = rawUser;

  return { user, token };
};
