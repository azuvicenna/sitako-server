import { count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { books, finePayments, librarians, members, transactions } from '@/db/schema';
import { withCacheAndPagination } from '@/utils/data/repository';
import { clearCacheByPattern } from '@/utils/core/cache';

export type FinePaymentInsert = typeof finePayments.$inferInsert;
export type FinePaymentSelect = typeof finePayments.$inferSelect;

const clearFinePaymentCache = async () => {
  await clearCacheByPattern('fine-payment:*');
};

export const findFinePaymentsWithPagination = async (
  page: number = 1,
  limit: number = 10,
  search: string = '',
) => {
  const trimmedSearch = search.trim();
  const cacheKey = `fine-payment:search:${trimmedSearch}:page:${page}:limit:${limit}`;

  return withCacheAndPagination(cacheKey, page, limit, async (offset, limit) => {
    const searchPattern = `%${trimmedSearch}%`;
    const whereClause = trimmedSearch
      ? or(
          ilike(sql`CAST(${finePayments.hargaDenda} AS TEXT)`, searchPattern),
          ilike(sql`CAST(${finePayments.totalDenda} AS TEXT)`, searchPattern),
          ilike(sql`CAST(${finePayments.metodePembayaran} AS TEXT)`, searchPattern),
          ilike(members.nama, searchPattern),
          ilike(librarians.nama, searchPattern),
          ilike(transactions.kdTransaksi, searchPattern),
          ilike(books.judul, searchPattern),
        )
      : undefined;

    const [data, [countResult]] = await Promise.all([
      db
        .select({
          id: finePayments.id,
          hargaDenda: finePayments.hargaDenda,
          totalDenda: finePayments.totalDenda,
          tglBayar: finePayments.tglBayar,
          metodePembayaran: finePayments.metodePembayaran,
          createdAt: finePayments.createdAt,
          namaPustakawan: librarians.nama,
          namaAnggota: members.nama,
          kdTransaksi: transactions.kdTransaksi,
          judulBuku: books.judul,
        })
        .from(finePayments)
        .leftJoin(librarians, eq(finePayments.pustakawanId, librarians.id))
        .innerJoin(members, eq(finePayments.anggotaId, members.id))
        .innerJoin(transactions, eq(finePayments.transaksiId, transactions.id))
        .innerJoin(books, eq(transactions.bukuId, books.id))
        .where(whereClause)
        .orderBy(desc(finePayments.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(finePayments)
        .leftJoin(librarians, eq(finePayments.pustakawanId, librarians.id))
        .innerJoin(members, eq(finePayments.anggotaId, members.id))
        .innerJoin(transactions, eq(finePayments.transaksiId, transactions.id))
        .innerJoin(books, eq(transactions.bukuId, books.id))
        .where(whereClause),
    ]);

    return { data, total: Number(countResult?.total ?? 0) };
  });
};

export const findFinePayment = async (id: string): Promise<FinePaymentSelect | null> => {
  const [payment] = await db.select().from(finePayments).where(eq(finePayments.id, id)).limit(1);

  return payment ?? null;
};

export const insertFinePayment = async (data: FinePaymentInsert): Promise<FinePaymentSelect> => {
  const [created] = await db.insert(finePayments).values(data).returning();

  if (created) {
    await clearFinePaymentCache();
  }

  return created;
};

export const updateFinePaymentById = async (
  id: string,
  data: Partial<FinePaymentInsert>,
): Promise<FinePaymentSelect | null> => {
  const [updated] = await db
    .update(finePayments)
    .set(data)
    .where(eq(finePayments.id, id))
    .returning();

  if (updated) {
    await clearFinePaymentCache();
  }

  return updated;
};

export const removeFinePaymentById = async (id: string): Promise<FinePaymentSelect | null> => {
  const [deleted] = await db.delete(finePayments).where(eq(finePayments.id, id)).returning();

  if (deleted) {
    await clearFinePaymentCache();
  }

  return deleted;
};

export const findPaymentByTripayReference = async (
  reference: string,
): Promise<FinePaymentSelect | null> => {
  const [payment] = await db
    .select()
    .from(finePayments)
    .where(eq(finePayments.tripayReference, reference))
    .limit(1);

  return payment ?? null;
};
