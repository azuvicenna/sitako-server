import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { bookmarks, books, finePayments, transactions } from '@/db/schema';
import { withCache } from '@/utils/data/repository';
import { clearCacheByPattern } from '@/utils/core/cache';

export interface MemberDashboardStatistics {
  bukuDipinjam: number;
  totalDenda: number;
  totalBookmark: number;
}

export interface MemberActiveTransaction {
  id: string;
  buku: {
    judul: string;
    cover: string;
  };
  tglKembali: Date | null;
  status: string;
}

export interface MemberFineBill {
  id: string;
  totalDenda: number;
  checkoutUrl: string | null;
}

export interface MemberRecentBookmark {
  id: string;
  buku: {
    judul: string;
    penulis: string;
    cover: string;
  };
}

export interface MemberDashboardData {
  statistik: MemberDashboardStatistics;
  transaksiAktif: MemberActiveTransaction[];
  tagihanDenda: MemberFineBill[];
  bookmarkTerbaru: MemberRecentBookmark[];
}

export const invalidateMemberDashboardCache = async (memberId?: string) => {
  const pattern = memberId ? `dashboard:member:${memberId}` : 'dashboard:member:*';
  await clearCacheByPattern(pattern);
};

export const getMemberDashboardRepo = async (memberId: string): Promise<MemberDashboardData> => {
  return withCache(`dashboard:member:${memberId}`, 60, async () => {
    const [
      [borrowedStats],
      [unpaidFinesStats],
      [bookmarkStats],
      activeTransactionsRaw,
      unpaidFinePaymentsRaw,
      recentBookmarksRaw,
    ] = await Promise.all([
      db
        .select({
          bukuDipinjam: sql<number>`count(*)::int`,
        })
        .from(transactions)
        .where(and(eq(transactions.anggotaId, memberId), eq(transactions.status, 'Dipinjam'))),

      db
        .select({
          totalDenda: sql<number>`coalesce(sum(${finePayments.totalDenda}), 0)::int`,
        })
        .from(finePayments)
        .where(and(eq(finePayments.anggotaId, memberId), eq(finePayments.paymentStatus, 'UNPAID'))),

      db
        .select({
          totalBookmark: sql<number>`count(*)::int`,
        })
        .from(bookmarks)
        .where(eq(bookmarks.anggotaId, memberId)),

      db
        .select({
          id: transactions.id,
          judul: books.judul,
          cover: books.cover,
          tglKembali: transactions.tglKembali,
          status: transactions.status,
        })
        .from(transactions)
        .innerJoin(books, eq(transactions.bukuId, books.id))
        .where(
          and(
            eq(transactions.anggotaId, memberId),
            inArray(transactions.status, [
              'Menunggu Persetujuan',
              'Menunggu Diambil',
              'Dipinjam',
              'Terlambat',
            ]),
          ),
        )
        .orderBy(desc(transactions.createdAt))
        .limit(5),

      db
        .select({
          id: finePayments.id,
          totalDenda: finePayments.totalDenda,
          checkoutUrl: finePayments.checkoutUrl,
        })
        .from(finePayments)
        .where(and(eq(finePayments.anggotaId, memberId), eq(finePayments.paymentStatus, 'UNPAID')))
        .orderBy(desc(finePayments.createdAt))
        .limit(5),

      db
        .select({
          id: bookmarks.id,
          judul: books.judul,
          penulis: books.penulis,
          cover: books.cover,
        })
        .from(bookmarks)
        .innerJoin(books, eq(bookmarks.bukuId, books.id))
        .where(eq(bookmarks.anggotaId, memberId))
        .orderBy(desc(bookmarks.createdAt))
        .limit(5),
    ]);

    const activeTransactions: MemberActiveTransaction[] = activeTransactionsRaw.map((trx) => ({
      id: trx.id,
      buku: {
        judul: trx.judul,
        cover: trx.cover,
      },
      tglKembali: trx.tglKembali,
      status: trx.status,
    }));

    const unpaidFinePayments: MemberFineBill[] = unpaidFinePaymentsRaw.map((fine) => ({
      id: fine.id,
      totalDenda: fine.totalDenda,
      checkoutUrl: fine.checkoutUrl,
    }));

    const recentBookmarks: MemberRecentBookmark[] = recentBookmarksRaw.map((bm) => ({
      id: bm.id,
      buku: {
        judul: bm.judul,
        penulis: bm.penulis,
        cover: bm.cover,
      },
    }));

    return {
      statistik: {
        bukuDipinjam: borrowedStats?.bukuDipinjam ?? 0,
        totalDenda: unpaidFinesStats?.totalDenda ?? 0,
        totalBookmark: bookmarkStats?.totalBookmark ?? 0,
      },
      transaksiAktif: activeTransactions,
      tagihanDenda: unpaidFinePayments,
      bookmarkTerbaru: recentBookmarks,
    };
  });
};
