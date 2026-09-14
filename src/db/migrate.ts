import "dotenv/config";
import path from "path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@/db";
import logger from "@/utils/core/logger";

export const runMigrations = async (): Promise<void> => {
  const migrationsFolder = path.resolve(process.cwd(), "drizzle");
  logger.info(`[Migrate] Running database migrations from: ${migrationsFolder}`);
  try {
    await migrate(db, { migrationsFolder });
    logger.info("[Migrate] Database migrations executed successfully.");
  } catch (error) {
    logger.error("[Migrate] Failed to execute database migrations:", error);
    throw error;
  }
};

if (require.main === module || process.argv[1]?.includes("migrate")) {
  runMigrations()
    .then(async () => {
      await pool.end();
      logger.info("[Migrate] Database connection closed.");
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error("[Migrate] Migration script exited with error:", err);
      await pool.end();
      process.exit(1);
    });
}
