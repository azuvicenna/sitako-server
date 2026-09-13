import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { books, librarians, members, transactions } from "@/db/schema";
import { withCacheAndPagination } from "@/utils/data/repository";
import { clearCacheByPattern } from "@/utils/core/cache";
import { invalidateDashboardCache } from "./dashboard.repository";

export type TransactionInsert = typeof transactions.$inferInsert;
export type TransactionSelect = typeof transactions.$inferSelect;

const clearTransactionCache = async () => {
  await Promise.all([
    clearCacheByPattern("transaction:*"),
    invalidateDashboardCache(),
  ]);
};

export const findTransactionsWithPagination = async (
  status: string,
  page: number = 1,
  limit: number = 10,
  search: string = "",
) => {
  const trimmedSearch = search.trim();
  const cacheKey = `transaction:status:${status}:search:${trimmedSearch}:page:${page}:limit:${limit}`;

  return withCacheAndPagination(
    cacheKey,
    page,
    limit,
    async (offset, limit) => {
      const conditions = [];

      if (status !== "Semua") {
        conditions.push(
          eq(transactions.status, status as TransactionSelect["status"]),
        );
      }

      if (trimmedSearch) {
        const searchPattern = `%${trimmedSearch}%`;
        conditions.push(
          or(
            ilike(transactions.kdTransaksi, searchPattern),
            ilike(members.nama, searchPattern),
            ilike(librarians.nama, searchPattern),
            ilike(books.judul, searchPattern),
          ),
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [data, [countResult]] = await Promise.all([
        db
          .select({
            id: transactions.id,
            kdTransaksi: transactions.kdTransaksi,
            tglPinjam: transactions.tglPinjam,
            tglKembali: transactions.tglKembali,
            status: transactions.status,
            namaAnggota: members.nama,
            namaPustakawan: librarians.nama,
            judulBuku: books.judul,
          })
          .from(transactions)
          .innerJoin(members, eq(transactions.anggotaId, members.id))
          .innerJoin(librarians, eq(transactions.pustakawanId, librarians.id))
          .innerJoin(books, eq(transactions.bukuId, books.id))
          .where(whereClause)
          .orderBy(desc(transactions.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(transactions)
          .innerJoin(members, eq(transactions.anggotaId, members.id))
          .innerJoin(librarians, eq(transactions.pustakawanId, librarians.id))
          .innerJoin(books, eq(transactions.bukuId, books.id))
          .where(whereClause),
      ]);

      return { data, total: Number(countResult?.total ?? 0) };
    },
  );
};

export const findTransaction = async (
  id: string,
): Promise<TransactionSelect | null> => {
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1);

  return transaction ?? null;
};

export const insertTransaction = async (
  data: TransactionInsert,
): Promise<TransactionSelect> => {
  const [created] = await db.insert(transactions).values(data).returning();

  if (created) {
    await clearTransactionCache();
  }

  return created;
};

export const updateTransactionById = async (
  id: string,
  data: Partial<TransactionInsert>,
): Promise<TransactionSelect | null> => {
  const [updated] = await db
    .update(transactions)
    .set(data)
    .where(eq(transactions.id, id))
    .returning();

  if (updated) {
    await clearTransactionCache();
  }

  return updated ?? null;
};

export const removeTransactionById = async (
  id: string,
): Promise<TransactionSelect | null> => {
  const [deleted] = await db
    .delete(transactions)
    .where(eq(transactions.id, id))
    .returning();

  if (deleted) {
    await clearTransactionCache();
  }

  return deleted ?? null;
};
