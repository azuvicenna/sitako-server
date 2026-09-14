import {
  findFinePaymentsWithPagination,
  findFinePayment,
} from '@/repositories/member/fine-payment.repository';
import { insertFinePayment } from '@/repositories/librarian/fine-payment.repository';
import { db } from '@/db';
import { transactions, fines, members, books } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createTransaction } from '@/utils/services/tripay';
import { generateTransactionCode } from '@/utils/generators/transaction-code';
import { notifyFineInvoice } from '@/services/notification/email-notification.service';

interface TripayTransactionData {
  reference: string;
  checkout_url: string;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_DAY_SECONDS = 24 * 60 * 60;

export const getFinePaymentsWithPagination = async (
  memberId: string,
  page: number,
  limit: number,
  search: string,
) => {
  return findFinePaymentsWithPagination(memberId, page, limit, search);
};

export const getFinePaymentById = async (id: string, memberId: string) => {
  return findFinePayment(id, memberId);
};

export const initiateOnlinePayment = async (
  memberId: string,
  transactionId: string,
  paymentMethodCode: string,
) => {
  const [transaction, member] = await Promise.all([
    db.query.transactions.findFirst({
      where: and(eq(transactions.id, transactionId), eq(transactions.anggotaId, memberId)),
    }),
    db.query.members.findFirst({
      where: eq(members.id, memberId),
    }),
  ]);

  if (!transaction) {
    throw new Error('Transaksi tidak ditemukan');
  }

  let fineType: 'Terlambat' | 'Hilang';
  if (transaction.status === 'Tidak Mengembalikan') {
    fineType = 'Hilang';
  } else if (transaction.status === 'Terlambat') {
    fineType = 'Terlambat';
  } else {
    throw new Error('Tidak ada denda pada transaksi ini');
  }

  const fineRule = await db.query.fines.findFirst({
    where: and(eq(fines.bukuId, transaction.bukuId), eq(fines.jenisDenda, fineType)),
  });

  if (!fineRule) {
    throw new Error('Aturan denda tidak ditemukan untuk transaksi ini');
  }

  const now = new Date();
  const returnDate = transaction.tglKembali ? new Date(transaction.tglKembali) : new Date();
  const diffTime = now.getTime() - returnDate.getTime();
  const daysLate = Math.max(1, Math.floor(diffTime / ONE_DAY_MS));

  const totalFine =
    fineRule.metodePerhitungan === 'Akumulasi'
      ? fineRule.hargaDenda * daysLate
      : fineRule.hargaDenda;

  const merchantRef = generateTransactionCode();

  const tripayPayload = {
    method: paymentMethodCode,
    merchant_ref: merchantRef,
    amount: totalFine,
    customer_name: member?.nama ?? 'Member',
    customer_email: member?.email ?? 'email@example.com',
    customer_phone: member?.telepon ?? '0800000000',
    order_items: [
      {
        sku: 'DENDA',
        name: `Denda ${fineType}`,
        price: totalFine,
        quantity: 1,
      },
    ],
    return_url: `${process.env.APP_URL ?? 'http://localhost:3000'}/member/payments`,
    expired_time: Math.floor(Date.now() / 1000) + ONE_DAY_SECONDS,
  };

  const tripayResponse = await createTransaction(tripayPayload);

  if (!tripayResponse.success) {
    throw new Error(`Tripay Error: ${tripayResponse.message}`);
  }

  const tripayData = tripayResponse.data as TripayTransactionData;

  const createdPayment = await insertFinePayment({
    anggotaId: memberId,
    transaksiId: transactionId,
    hargaDenda: fineRule.hargaDenda,
    totalDenda: totalFine,
    metodePembayaran: 'Non-Tunai',
    paymentStatus: 'UNPAID',
    tripayReference: tripayData.reference,
    paymentMethodCode,
    checkoutUrl: tripayData.checkout_url,
  });

  const book = await db.query.books.findFirst({
    where: eq(books.id, transaction.bukuId),
  });

  if (member?.email) {
    notifyFineInvoice({
      email: member.email,
      namaAnggota: member.nama,
      judulBuku: book?.judul ?? 'Buku Perpustakaan',
      kdTransaksi: transaction.kdTransaksi,
      jenisDenda: fineType,
      totalDenda: totalFine,
      metodePembayaran: 'Non-Tunai',
      checkoutUrl: tripayData.checkout_url,
      paymentMethodCode,
      tripayReference: tripayData.reference,
    });
  }

  return createdPayment;
};
