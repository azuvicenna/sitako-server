import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { fines } from '@/db/schema';
import {
  findTransaction,
  updateTransactionStatus,
} from '@/repositories/member/transaction.repository';
import {
  notifyLoanStatusChange,
  formatIndonesianDate,
} from '@/services/notification/email-notification.service';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const RETURNABLE_STATUSES: readonly string[] = ['Dipinjam', 'Terlambat'];

export interface ReturnFineDetail {
  jenisDenda: 'Terlambat' | 'Hilang';
  hargaDenda: number;
  metodePerhitungan: string;
  hariTerlambat: number;
  totalDenda: number;
}

export interface ReturnBookResult {
  status: 'Dikembalikan' | 'Terlambat' | 'Tidak Mengembalikan';
  isTerlambat: boolean;
  isBukuHilang: boolean;
  denda: ReturnFineDetail | null;
  pesan: string;
}

const calculateDaysLate = (dueDate: Date, now: Date): number => {
  const diff = now.getTime() - dueDate.getTime();
  return Math.max(1, Math.floor(diff / ONE_DAY_MS));
};

const getFineRule = async (bookId: string, fineType: 'Terlambat' | 'Hilang') => {
  const result = await db
    .select()
    .from(fines)
    .where(and(eq(fines.bukuId, bookId), eq(fines.jenisDenda, fineType)))
    .limit(1);

  return result[0] ?? null;
};

export const returnBook = async (
  transactionId: string,
  memberId: string,
  isBookLost: boolean,
): Promise<ReturnBookResult | null> => {
  const transaction = await findTransaction(transactionId, memberId);
  if (!transaction) return null;

  if (!RETURNABLE_STATUSES.includes(transaction.status)) {
    const error = new Error(
      `Transaksi dengan status "${transaction.status}" tidak dapat dikembalikan`,
    );
    Object.assign(error, { statusCode: 422 });
    throw error;
  }

  const now = new Date();
  const dueDate = transaction.tglKembali ? new Date(transaction.tglKembali) : null;
  const isLate = dueDate ? now.getTime() > dueDate.getTime() : false;

  if (!isLate) {
    await updateTransactionStatus(transactionId, 'Dikembalikan');

    notifyLoanStatusChange({
      email: transaction.emailAnggota,
      namaAnggota: transaction.namaAnggota,
      judulBuku: transaction.judulBuku,
      kdTransaksi: transaction.kdTransaksi,
      status: 'Dikembalikan',
      tglPinjam: formatIndonesianDate(transaction.tglPinjam),
      tglKembali: formatIndonesianDate(transaction.tglKembali),
    });

    return {
      status: 'Dikembalikan',
      isTerlambat: false,
      isBukuHilang: false,
      denda: null,
      pesan: 'Pengembalian berhasil diajukan. Menunggu konfirmasi fisik dari pustakawan.',
    };
  }

  const daysLate = calculateDaysLate(dueDate!, now);
  const fineType = isBookLost ? 'Hilang' : 'Terlambat';
  const newStatus = isBookLost ? 'Tidak Mengembalikan' : 'Terlambat';

  await updateTransactionStatus(transactionId, newStatus);

  const fineRule = await getFineRule(transaction.bukuId, fineType);

  const totalFine = fineRule
    ? fineRule.metodePerhitungan === 'Akumulasi'
      ? fineRule.hargaDenda * daysLate
      : fineRule.hargaDenda
    : 0;

  const fineDetail: ReturnFineDetail | null = fineRule
    ? {
        jenisDenda: fineType,
        hargaDenda: fineRule.hargaDenda,
        metodePerhitungan: fineRule.metodePerhitungan,
        hariTerlambat: daysLate,
        totalDenda: totalFine,
      }
    : null;

  const message = isBookLost
    ? 'Buku dilaporkan hilang. Menunggu konfirmasi dan pembayaran denda dari pustakawan.'
    : 'Pengembalian berhasil diajukan. Terdapat denda keterlambatan yang menunggu konfirmasi pembayaran dari pustakawan.';

  notifyLoanStatusChange({
    email: transaction.emailAnggota,
    namaAnggota: transaction.namaAnggota,
    judulBuku: transaction.judulBuku,
    kdTransaksi: transaction.kdTransaksi,
    status: newStatus,
    tglPinjam: formatIndonesianDate(transaction.tglPinjam),
    tglKembali: formatIndonesianDate(transaction.tglKembali),
    pesanTambahan: message,
  });

  return {
    status: newStatus,
    isTerlambat: true,
    isBukuHilang: isBookLost,
    denda: fineDetail,
    pesan: message,
  };
};

export const kembalikanBuku = returnBook;
