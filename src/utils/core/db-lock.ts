import os from "os";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import logger from "@/utils/core/logger";

export const getInstanceId = (): string => {
  return (
    process.env.HOSTNAME ||
    process.env.POD_NAME ||
    os.hostname() ||
    `instance-${process.pid}`
  );
};

export const ensureLockTablesExist = async (): Promise<void> => {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS scheduler_locks (
        job_name VARCHAR(100) PRIMARY KEY,
        locked_by VARCHAR(100) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reminder_logs (
        id VARCHAR(50) PRIMARY KEY,
        transaksi_id VARCHAR(50) NOT NULL REFERENCES transactions(id) ON DELETE CASCADE ON UPDATE CASCADE,
        tipe_pengingat VARCHAR(50) NOT NULL,
        sent_date DATE NOT NULL,
        sent_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS reminder_tx_type_date_idx
      ON reminder_logs (transaksi_id, tipe_pengingat, sent_date);
    `);
  } catch (error) {
    logger.error("Error ensuring scheduler tables exist:", error);
  }
};

/**
 * Attempts to acquire an atomic distributed lock in PostgreSQL.
 * Returns true if lock was acquired, false otherwise.
 */
export const acquireDbLock = async (
  jobName: string,
  lockedBy: string,
  ttlSeconds: number = 3600,
): Promise<boolean> => {
  try {
    const result: any = await db.execute(sql`
      INSERT INTO scheduler_locks (job_name, locked_by, expires_at)
      VALUES (${jobName}, ${lockedBy}, NOW() + (${ttlSeconds} || ' seconds')::interval)
      ON CONFLICT (job_name)
      DO UPDATE SET
        locked_by = EXCLUDED.locked_by,
        expires_at = EXCLUDED.expires_at
      WHERE scheduler_locks.expires_at < NOW()
      RETURNING job_name;
    `);

    const rows = result.rows ?? result;
    return Array.isArray(rows) && rows.length > 0;
  } catch (error) {
    logger.error(`Error acquiring DB lock for job "${jobName}":`, error);
    return false;
  }
};

/**
 * Releases the lock by setting expires_at to NOW(),
 * BUT ONLY IF the lock is currently owned by lockedBy.
 */
export const releaseDbLock = async (
  jobName: string,
  lockedBy: string,
): Promise<boolean> => {
  try {
    const result: any = await db.execute(sql`
      UPDATE scheduler_locks
      SET expires_at = NOW()
      WHERE job_name = ${jobName} AND locked_by = ${lockedBy}
      RETURNING job_name;
    `);

    const rows = result.rows ?? result;
    return Array.isArray(rows) && rows.length > 0;
  } catch (error) {
    logger.error(`Error releasing DB lock for job "${jobName}":`, error);
    return false;
  }
};
