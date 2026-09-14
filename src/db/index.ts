import 'dotenv/config';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';

const host = process.env.POSTGRES_HOST || 'localhost';
const port = process.env.POSTGRES_PORT || '5432';
const user = process.env.POSTGRES_USER || 'postgres';
const password = process.env.POSTGRES_PASSWORD || 'password';
const dbName = process.env.POSTGRES_DB || 'mydb';

export const databaseUrl: string =
  process.env.DATABASE_URL ||
  `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${dbName}`;

export const pool: Pool = new Pool({
  connectionString: databaseUrl,
});

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });
