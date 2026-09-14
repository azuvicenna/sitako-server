import 'dotenv/config';
import bcrypt from 'bcrypt';
import { db, pool } from '@/db';
import { librarians } from '@/db/schema';
import logger from '@/utils/core/logger';

export const runSeed = async (): Promise<void> => {
  try {
    logger.info('[Seed] Checking if librarian account already exists...');
    const existingLibrarians = await db.select().from(librarians).limit(1);

    if (existingLibrarians.length > 0) {
      logger.info('[Seed] A librarian account already exists. Skipping seed.');
      return;
    }

    const nip = process.env.SEED_LIBRARIAN_NIP || '198001012005011001';
    const password = process.env.SEED_LIBRARIAN_PASSWORD || 'admin123';
    const nama = process.env.SEED_LIBRARIAN_NAMA || 'Administrator Perpustakaan';
    const email = process.env.SEED_LIBRARIAN_EMAIL || 'admin@sitako.local';
    const telepon = process.env.SEED_LIBRARIAN_TELEPON || '081234567890';
    const foto = process.env.SEED_LIBRARIAN_FOTO || 'default.png';

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.insert(librarians).values({
      nama,
      nip,
      email,
      password: hashedPassword,
      telepon,
      foto,
      status_aktif: true,
    });

    logger.info(
      `[Seed] Initial librarian created successfully!\n  NIP     : ${nip}\n  Password: ${password}\n  Nama    : ${nama}\n  Email   : ${email}`,
    );
  } catch (error) {
    logger.error('[Seed] Failed to seed librarian account:', error);
    throw error;
  }
};

if (require.main === module || process.argv[1]?.includes('seed')) {
  runSeed()
    .then(async () => {
      await pool.end();
      logger.info('[Seed] Database connection closed.');
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error('[Seed] Seeder script exited with error:', err);
      await pool.end();
      process.exit(1);
    });
}
