import { acquireDbLock, releaseDbLock } from "@/utils/core/db-lock";
import { db } from "@/db";

jest.mock("@/db", () => ({
  db: {
    execute: jest.fn(),
  },
}));

jest.mock("@/utils/core/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe("DB Distributed Lock Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("acquireDbLock", () => {
    it("should return true when atomic insert/update succeeds", async () => {
      (db.execute as jest.Mock).mockResolvedValueOnce({
        rows: [{ job_name: "test-job" }],
      });

      const acquired = await acquireDbLock("test-job", "pod-1", 3600);
      expect(acquired).toBe(true);
      expect(db.execute).toHaveBeenCalledTimes(1);
    });

    it("should return false when lock is held by another instance and not expired", async () => {
      (db.execute as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      const acquired = await acquireDbLock("test-job", "pod-2", 3600);
      expect(acquired).toBe(false);
    });

    it("should return false and log when query throws an error", async () => {
      (db.execute as jest.Mock).mockRejectedValueOnce(new Error("DB Connection Error"));

      const acquired = await acquireDbLock("test-job", "pod-3", 3600);
      expect(acquired).toBe(false);
    });
  });

  describe("releaseDbLock", () => {
    it("should return true when lock owner releases lock", async () => {
      (db.execute as jest.Mock).mockResolvedValueOnce({
        rows: [{ job_name: "test-job" }],
      });

      const released = await releaseDbLock("test-job", "pod-1");
      expect(released).toBe(true);
    });

    it("should return false if caller does not own the lock (WHERE locked_by condition)", async () => {
      // If caller is pod-2 but pod-1 owns it, rows returned is empty
      (db.execute as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      const released = await releaseDbLock("test-job", "pod-2");
      expect(released).toBe(false);
    });

    it("should return false on database error", async () => {
      (db.execute as jest.Mock).mockRejectedValueOnce(new Error("DB Timeout"));

      const released = await releaseDbLock("test-job", "pod-1");
      expect(released).toBe(false);
    });
  });
});
