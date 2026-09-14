import {
  insertFinePayment,
  updateFinePaymentById,
  findFinePayment,
  removeFinePaymentById,
  findFinePaymentsWithPagination,
  type FinePaymentInsert,
} from '@/repositories/librarian/fine-payment.repository';
import type {
  CreateFinePayment,
  UpdateFinePayment,
} from '@/validations/librarian/fine-payment.schema';
import { db } from '@/db';
import { members, books, transactions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  notifyFinePaymentSuccess,
  formatIndonesianDate,
} from '@/services/notification/email-notification.service';

export const getFinePaymentsWithPagination = async (
  page: number,
  limit: number,
  search: string,
) => {
  return findFinePaymentsWithPagination(page, limit, search);
};

export const getFinePaymentById = async (id: string) => {
  return findFinePayment(id);
};

export const createNewFinePayment = async (payload: CreateFinePayment) => {
  const paymentData: FinePaymentInsert = {
    ...payload,
    paymentStatus: 'PAID',
    tglBayar: payload.tglBayar ?? new Date(),
  };

  const created = await insertFinePayment(paymentData);

  if (created) {
    const [memberAndBook] = await db
      .select({
        email: members.email,
        namaAnggota: members.nama,
        judulBuku: books.judul,
        kdTransaksi: transactions.kdTransaksi,
      })
      .from(members)
      .innerJoin(transactions, eq(transactions.anggotaId, members.id))
      .innerJoin(books, eq(transactions.bukuId, books.id))
      .where(eq(transactions.id, created.transaksiId))
      .limit(1);

    if (memberAndBook) {
      notifyFinePaymentSuccess({
        email: memberAndBook.email,
        namaAnggota: memberAndBook.namaAnggota,
        judulBuku: memberAndBook.judulBuku,
        kdTransaksi: memberAndBook.kdTransaksi,
        totalDenda: created.totalDenda,
        metodePembayaran: created.metodePembayaran,
        tglBayar: formatIndonesianDate(created.tglBayar),
        tripayReference: created.tripayReference,
      });
    }
  }

  return created;
};

export const updateExistingFinePayment = async (id: string, payload: UpdateFinePayment) => {
  const existingPayment = await findFinePayment(id);
  if (!existingPayment) return null;

  if (Object.keys(payload).length === 0) {
    return existingPayment;
  }

  const updateData: Partial<FinePaymentInsert> = { ...payload };
  const updated = await updateFinePaymentById(id, updateData);

  if (updated && payload.paymentStatus === 'PAID' && existingPayment.paymentStatus !== 'PAID') {
    const [memberAndBook] = await db
      .select({
        email: members.email,
        namaAnggota: members.nama,
        judulBuku: books.judul,
        kdTransaksi: transactions.kdTransaksi,
      })
      .from(members)
      .innerJoin(transactions, eq(transactions.anggotaId, members.id))
      .innerJoin(books, eq(transactions.bukuId, books.id))
      .where(eq(transactions.id, updated.transaksiId))
      .limit(1);

    if (memberAndBook) {
      notifyFinePaymentSuccess({
        email: memberAndBook.email,
        namaAnggota: memberAndBook.namaAnggota,
        judulBuku: memberAndBook.judulBuku,
        kdTransaksi: memberAndBook.kdTransaksi,
        totalDenda: updated.totalDenda,
        metodePembayaran: updated.metodePembayaran,
        tglBayar: formatIndonesianDate(updated.tglBayar),
        tripayReference: updated.tripayReference,
      });
    }
  }

  return updated;
};

export const deleteExistingFinePayment = async (id: string) => {
  return removeFinePaymentById(id);
};
