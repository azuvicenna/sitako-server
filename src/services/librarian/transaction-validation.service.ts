import { db } from "@/db";
import { transactions, books, finePayments } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

const MAX_ACTIVE_TRANSACTIONS = 3;

export interface ValidationResult {
  success: boolean;
  message?: string;
}

export const validateTransactionCreation = async (
  memberId: string,
  bookId: string,
): Promise<ValidationResult> => {
  const penaltyTransactions = await db
    .select({
      id: transactions.id,
      status: transactions.status,
      paidPaymentId: finePayments.id,
    })
    .from(transactions)
    .leftJoin(
      finePayments,
      and(
        eq(finePayments.transaksiId, transactions.id),
        eq(finePayments.paymentStatus, "PAID"),
      ),
    )
    .where(
      and(
        eq(transactions.anggotaId, memberId),
        inArray(transactions.status, ["Terlambat", "Tidak Mengembalikan"]),
      ),
    );

  const lateTransaction = penaltyTransactions.find(
    (trx) => trx.status === "Terlambat",
  );
  if (lateTransaction) {
    return {
      success: false,
      message:
        "Member memiliki buku yang terlambat dikembalikan (fisik belum dikonfirmasi)",
    };
  }

  const unpaidLostTransaction = penaltyTransactions.find(
    (trx) => trx.status === "Tidak Mengembalikan" && !trx.paidPaymentId,
  );
  if (unpaidLostTransaction) {
    return {
      success: false,
      message: "Member memiliki denda buku hilang yang belum dibayar lunas",
    };
  }

  const [bookResult, borrowedResult, activeTransactionsResult] =
    await Promise.all([
      db
        .select({ stock: books.jumlahStok })
        .from(books)
        .where(eq(books.id, bookId))
        .limit(1),
      db
        .select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(
          and(
            eq(transactions.bukuId, bookId),
            inArray(transactions.status, [
              "Menunggu Diambil",
              "Dipinjam",
              "Terlambat",
              "Tidak Mengembalikan",
            ]),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(
          and(
            eq(transactions.anggotaId, memberId),
            inArray(transactions.status, [
              "Menunggu Persetujuan",
              "Menunggu Diambil",
              "Dipinjam",
            ]),
          ),
        ),
    ]);

  if (bookResult.length === 0) {
    return { success: false, message: "Buku tidak ditemukan" };
  }

  const totalStock = bookResult[0].stock;
  const totalBorrowed = Number(borrowedResult[0]?.count ?? 0);

  if (totalStock <= totalBorrowed) {
    return { success: false, message: "Stok buku habis" };
  }

  const activeTransactionsCount = Number(
    activeTransactionsResult[0]?.count ?? 0,
  );

  if (activeTransactionsCount >= MAX_ACTIVE_TRANSACTIONS) {
    return {
      success: false,
      message: `Maksimum pinjam tercapai (maksimal ${MAX_ACTIVE_TRANSACTIONS} transaksi aktif)`,
    };
  }

  return { success: true };
};
