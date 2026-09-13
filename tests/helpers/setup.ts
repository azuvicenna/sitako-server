/**
 * Setup file yang dijalankan sebelum setiap test suite.
 * Load environment variables dari .env.test secara manual
 * tanpa bergantung pada package dotenv.
 */
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../../.env.test");

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.substring(0, idx).trim();
    let val = trimmed.substring(idx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = val;
    }
  }
}

jest.mock("ulid", () => require("./ulid-mock.js"));
jest.mock("winston", () => require("./winston-mock.js"));
