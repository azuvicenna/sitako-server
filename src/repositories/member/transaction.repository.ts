import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { books, librarians, members, transactions } from "@/db/schema";
import { withCacheAndPagination } from "@/utils/data/repository";
import { clearCacheByPattern } from "@/utils/core/cache";
import { invalidateDashboardCache } from "@/repositories/librarian/dashboard.repository";
import { invalidateMemberDashboardCache } from "./dashboard.repository";

export type TransactionInsert = typeof transactions.$inferInsert;
export type TransactionSelect = typeof transactions.$inferSelect;

const clearTransactionCache = async () => {
  await Promise.all([
    clearCacheByPattern("transaction:*"),
    invalidateDashboardCache(),
    invalidateMemberDashboardCache(),
  ]);
};

export const findTransactionsWithPagination = async (
  anggotaId: string,
  status: string,
  page: number = 1,
  limit: number = 10,
  search: string = "",
) => {
  const trimmedSearch = search.trim();
  const cacheKey = `transaction:anggota:${anggotaId}:status:${status}:search:${trimmedSearch}:page:${page}:limit:${limit}`;

  return withCacheAndPagination(
    cacheKey,
    page,
    limit,
    async (offset, limit) => {
      const conditions = [eq(transactions.anggotaId, anggotaId)];

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
            ilike(librarians.nama, searchPattern),
            ilike(books.judul, searchPattern),
          )!,
        );
      }

      const whereClause = and(...conditions);

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

export const findTransaction = async (id: string, anggotaId: string) => {
  const [transaction] = await db
    .select({
      id: transactions.id,
      kdTransaksi: transactions.kdTransaksi,
      tglPinjam: transactions.tglPinjam,
      tglKembali: transactions.tglKembali,
      status: transactions.status,
      namaAnggota: members.nama,
      emailAnggota: members.email,
      namaPustakawan: librarians.nama,
      judulBuku: books.judul,
      bukuId: transactions.bukuId,
      pustakawanId: transactions.pustakawanId,
      anggotaId: transactions.anggotaId,
    })
    .from(transactions)
    .innerJoin(members, eq(transactions.anggotaId, members.id))
    .innerJoin(librarians, eq(transactions.pustakawanId, librarians.id))
    .innerJoin(books, eq(transactions.bukuId, books.id))
    .where(and(eq(transactions.id, id), eq(transactions.anggotaId, anggotaId)))
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

export const updateTransactionStatus = async (
  id: string,
  status: TransactionSelect["status"],
): Promise<TransactionSelect | null> => {
  const [updated] = await db
    .update(transactions)
    .set({ status })
    .where(eq(transactions.id, id))
    .returning();

  if (updated) {
    await clearTransactionCache();
  }

  return updated ?? null;
};
