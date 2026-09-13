import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  books,
  finePayments,
  librarians,
  members,
  transactions,
} from "@/db/schema";
import { withCacheAndPagination } from "@/utils/data/repository";

export type FinePaymentSelect = typeof finePayments.$inferSelect;

export const findFinePaymentsWithPagination = async (
  anggotaId: string,
  page: number = 1,
  limit: number = 10,
  search: string = "",
) => {
  const trimmedSearch = search.trim();
  const cacheKey = `member-fine-payment:anggota:${anggotaId}:search:${trimmedSearch}:page:${page}:limit:${limit}`;

  return withCacheAndPagination(
    cacheKey,
    page,
    limit,
    async (offset, limit) => {
      const searchCondition = trimmedSearch
        ? or(
            ilike(
              sql`CAST(${finePayments.metodePembayaran} AS TEXT)`,
              `%${trimmedSearch}%`,
            ),
            ilike(transactions.kdTransaksi, `%${trimmedSearch}%`),
            ilike(books.judul, `%${trimmedSearch}%`),
            ilike(librarians.nama, `%${trimmedSearch}%`),
          )
        : undefined;

      const whereClause = and(
        eq(finePayments.anggotaId, anggotaId),
        searchCondition,
      );

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
            kdTransaksi: transactions.kdTransaksi,
            judulBuku: books.judul,
          })
          .from(finePayments)
          .leftJoin(librarians, eq(finePayments.pustakawanId, librarians.id))
          .innerJoin(members, eq(finePayments.anggotaId, members.id))
          .innerJoin(
            transactions,
            eq(finePayments.transaksiId, transactions.id),
          )
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
          .innerJoin(
            transactions,
            eq(finePayments.transaksiId, transactions.id),
          )
          .innerJoin(books, eq(transactions.bukuId, books.id))
          .where(whereClause),
      ]);

      return { data, total: Number(countResult?.total ?? 0) };
    },
  );
};

export const findFinePayment = async (id: string, anggotaId: string) => {
  const [payment] = await db
    .select({
      id: finePayments.id,
      hargaDenda: finePayments.hargaDenda,
      totalDenda: finePayments.totalDenda,
      tglBayar: finePayments.tglBayar,
      metodePembayaran: finePayments.metodePembayaran,
      createdAt: finePayments.createdAt,
      namaPustakawan: librarians.nama,
      kdTransaksi: transactions.kdTransaksi,
      judulBuku: books.judul,
      tglPinjam: transactions.tglPinjam,
      tglKembali: transactions.tglKembali,
      statusTransaksi: transactions.status,
    })
    .from(finePayments)
    .leftJoin(librarians, eq(finePayments.pustakawanId, librarians.id))
    .innerJoin(members, eq(finePayments.anggotaId, members.id))
    .innerJoin(transactions, eq(finePayments.transaksiId, transactions.id))
    .innerJoin(books, eq(transactions.bukuId, books.id))
    .where(and(eq(finePayments.id, id), eq(finePayments.anggotaId, anggotaId)))
    .limit(1);

  return payment ?? null;
};
