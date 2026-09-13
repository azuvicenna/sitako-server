declare const process: { env: Record<string, string | undefined> };

import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const host = process.env.POSTGRES_HOST || "localhost";
const port = process.env.POSTGRES_PORT || "5432";
const user = process.env.POSTGRES_USER || "postgres";
const password = process.env.POSTGRES_PASSWORD || "password";
const dbName = process.env.POSTGRES_DB || "mydb";

const databaseUrl =
  process.env.DATABASE_URL ||
  `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${dbName}`;

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
