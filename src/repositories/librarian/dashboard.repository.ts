import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { db } from '@/db';
import { books, members, transactions } from '@/db/schema';
import { withCache, withCacheAndPagination } from '@/utils/data/repository';
import { clearCacheByPattern } from '@/utils/core/cache';

type TransactionStatus = (typeof transactions.$inferSelect)['status'];

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

export const invalidateDashboardCache = async () => {
  await clearCacheByPattern([
    'dashboard:summary',
    'dashboard:trx:summary',
    'dashboard:trx:table:*',
    'dashboard:statistics:weekly',
  ]);
};

export const getDashboardSummaryRepo = async () => {
  return withCache('dashboard:summary', 300, async () => {
    const [[booksCount], [membersCount], [trxCount]] = await Promise.all([
      db
        .select({
          fisik: sql<number>`count(case when ${books.tipeBuku} = 'Fisik' then 1 end)::int`,
          digital: sql<number>`count(case when ${books.tipeBuku} = 'Digital' then 1 end)::int`,
        })
        .from(books),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(members)
        .where(eq(members.status_aktif, true)),
      db
        .select({
          bukuDipinjam: sql<number>`count(case when ${transactions.status} = 'Dipinjam' then 1 end)::int`,
          jatuhTempo: sql<number>`count(case when ${transactions.status} = 'Terlambat' then 1 end)::int`,
        })
        .from(transactions)
        .where(inArray(transactions.status, ['Dipinjam', 'Terlambat'])),
    ]);

    return {
      buku: booksCount ?? { fisik: 0, digital: 0 },
      anggotaAktif: membersCount?.count ?? 0,
      bukuDipinjam: trxCount?.bukuDipinjam ?? 0,
      jatuhTempo: trxCount?.jatuhTempo ?? 0,
    };
  });
};

export const getTodayTransactionsRepo = async (page: number, limit: number, status: string) => {
  const statusKey = status.replace(/\s+/g, '');
  const cacheKey = `dashboard:trx:table:${statusKey}:${page}:${limit}`;

  return withCacheAndPagination(cacheKey, page, limit, async (offset, limit) => {
    const { start, end } = getTodayRange();
    const baseConditions = [gte(transactions.createdAt, start), lte(transactions.createdAt, end)];

    if (status && status !== 'Semua') {
      baseConditions.push(eq(transactions.status, status as TransactionStatus));
    }

    const whereClause = and(...baseConditions);

    const [data, [totalFiltered]] = await Promise.all([
      db.select().from(transactions).where(whereClause).limit(limit).offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(transactions)
        .where(whereClause),
    ]);

    return { data, total: totalFiltered?.count ?? 0 };
  });
};

export const getTodaySummaryRepo = async () => {
  return withCache('dashboard:trx:summary', 60, async () => {
    const { start, end } = getTodayRange();

    const [summaryCounts] = await db
      .select({
        semua: sql<number>`count(*)::int`,
        menungguPersetujuan: sql<number>`count(case when ${transactions.status} = 'Menunggu Persetujuan' then 1 end)::int`,
        dibatalkan: sql<number>`count(case when ${transactions.status} = 'Dibatalkan' then 1 end)::int`,
        menungguDiambil: sql<number>`count(case when ${transactions.status} = 'Menunggu Diambil' then 1 end)::int`,
        dipinjam: sql<number>`count(case when ${transactions.status} = 'Dipinjam' then 1 end)::int`,
        dikembalikan: sql<number>`count(case when ${transactions.status} = 'Dikembalikan' then 1 end)::int`,
        terlambat: sql<number>`count(case when ${transactions.status} = 'Terlambat' then 1 end)::int`,
        tidakMengembalikan: sql<number>`count(case when ${transactions.status} = 'Tidak Mengembalikan' then 1 end)::int`,
      })
      .from(transactions)
      .where(and(gte(transactions.createdAt, start), lte(transactions.createdAt, end)));

    return summaryCounts;
  });
};

export const getWeeklyStatisticsRepo = async () => {
  return withCache('dashboard:statistics:weekly', 300, async () => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    return db
      .select({
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(and(gte(transactions.createdAt, startDate), lte(transactions.createdAt, endDate)));
  });
};
