import { and, desc, eq, gte, isNotNull, lte, sql } from 'drizzle-orm';
import { db } from '@/db';
import { books, finePayments, members, transactions } from '@/db/schema';
import type { CirculationRow, DateRangeFilter, FineRow } from '@/types/report.types';

export const getCirculationReport = async (filter: DateRangeFilter): Promise<CirculationRow[]> => {
  const conditions = [];

  if (filter.startDate) {
    conditions.push(gte(transactions.tglPinjam, filter.startDate));
  }
  if (filter.endDate) {
    conditions.push(lte(transactions.tglPinjam, filter.endDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select({
      kdTransaksi: transactions.kdTransaksi,
      namaPeminjam: members.nama,
      judulBuku: books.judul,
      tglPinjam: transactions.tglPinjam,
      tglKembali: transactions.tglKembali,
      status: transactions.status,
    })
    .from(transactions)
    .innerJoin(members, eq(transactions.anggotaId, members.id))
    .innerJoin(books, eq(transactions.bukuId, books.id))
    .where(whereClause)
    .orderBy(desc(transactions.tglPinjam));
};

export const getFineReport = async (filter: DateRangeFilter): Promise<FineRow[]> => {
  const conditions = [];

  if (filter.startDate) {
    conditions.push(gte(finePayments.tglBayar, filter.startDate));
  }
  if (filter.endDate) {
    conditions.push(lte(finePayments.tglBayar, filter.endDate));
  }
  if (filter.startDate || filter.endDate) {
    conditions.push(isNotNull(finePayments.tglBayar));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select({
      namaPeminjam: members.nama,
      judulBuku: books.judul,
      totalDenda: finePayments.totalDenda,
      metodePembayaran: finePayments.metodePembayaran,
      paymentStatus: finePayments.paymentStatus,
      tglBayar: finePayments.tglBayar,
    })
    .from(finePayments)
    .innerJoin(members, eq(finePayments.anggotaId, members.id))
    .innerJoin(transactions, eq(finePayments.transaksiId, transactions.id))
    .innerJoin(books, eq(transactions.bukuId, books.id))
    .where(whereClause)
    .orderBy(sql`${finePayments.tglBayar} desc nulls last`);
};
