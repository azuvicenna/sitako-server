import { sql } from 'drizzle-orm';
import { db, pool } from '@/db';

afterAll(async () => {
  await pool.end();
});

describe('Database Integration Test', () => {
  it('should establish a valid connection to the database', async () => {
    const result = await db.execute(sql`SELECT 1 AS connected`);
    expect(result.rows[0].connected).toBe(1);
  });
});
