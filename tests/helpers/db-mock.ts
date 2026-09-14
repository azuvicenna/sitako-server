/**
 * Mock untuk @/db dan @/db/* di lingkungan test.
 * Mengekspos semua enum dan db object palsu agar validasi schema
 * dan repository tidak membutuhkan koneksi database nyata.
 */

// Mock enum values yang dipakai oleh Zod validation schemas
export const bookTypeEnum = {
  enumValues: ["Fisik", "Digital"] as const,
};

export const fineTypeEnum = {
  enumValues: ["Terlambat", "Hilang"] as const,
};

export const calculationTypeEnum = {
  enumValues: ["Akumulasi", "Flat"] as const,
};

export const transactionStatusEnum = {
  enumValues: [
    "Menunggu Persetujuan",
    "Dibatalkan",
    "Menunggu Diambil",
    "Dipinjam",
    "Dikembalikan",
    "Terlambat",
    "Tidak Mengembalikan",
  ] as const,
};

export const paymentMethodEnum = {
  enumValues: ["Tunai", "Non-Tunai"] as const,
};

export const paymentStatusEnum = {
  enumValues: ["UNPAID", "PAID", "EXPIRED", "FAILED"] as const,
};

// Tabel mock (tidak dipakai langsung, tapi perlu diekspor untuk schema.ts)
export const librarians = {};
export const members = {};
export const shelves = {};
export const books = {};
export const stacks = {};
export const bookmarks = {};
export const fines = {};
export const transactions = {};
export const finePayments = {};

// Mock db connection — tidak ada koneksi nyata
export const pool = {
  connect: jest.fn(),
  end: jest.fn(),
  query: jest.fn(),
};

export const db = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  execute: jest.fn().mockResolvedValue([]),
  returning: jest.fn().mockResolvedValue([]),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
};
