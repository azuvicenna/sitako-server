import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { librarians, members } from '@/db/schema';

export const findLibrarianByNip = async (nip: string) => {
  const [librarian] = await db.select().from(librarians).where(eq(librarians.nip, nip)).limit(1);

  return librarian;
};

export const findMemberByNis = async (nis: string) => {
  const [member] = await db.select().from(members).where(eq(members.nis, nis)).limit(1);

  return member;
};
