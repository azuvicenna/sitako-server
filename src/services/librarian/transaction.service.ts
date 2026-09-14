import {
  insertTransaction,
  updateTransactionById,
  findTransaction,
  removeTransactionById,
  findTransactionsWithPagination,
  type TransactionInsert,
} from '@/repositories/librarian/transaction.repository';
import { generateTransactionCode } from '@/utils/generators/transaction-code';
import type {
  CreateTransaction,
  UpdateTransaction,
} from '@/validations/librarian/transaction.schema';
import { db } from '@/db';
import { members, books, transactions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  notifyLoanStatusChange,
  formatIndonesianDate,
} from '@/services/notification/email-notification.service';

export const getTransactionsWithPagination = async (
  status: string,
  page: number,
  limit: number,
  search: string,
) => {
  return findTransactionsWithPagination(status, page, limit, search);
};

export const getTransactionById = async (id: string) => {
  return findTransaction(id);
};

export const createNewTransaction = async (payload: CreateTransaction) => {
  const transactionData: TransactionInsert = {
    ...payload,
    kdTransaksi: generateTransactionCode(),
    status: 'Dipinjam',
  };

  const created = await insertTransaction(transactionData);

  if (created) {
    const [memberAndBook] = await db
      .select({
        namaAnggota: members.nama,
        email: members.email,
        judulBuku: books.judul,
      })
      .from(members)
      .innerJoin(transactions, eq(transactions.anggotaId, members.id))
      .innerJoin(books, eq(transactions.bukuId, books.id))
      .where(eq(transactions.id, created.id))
      .limit(1);

    if (memberAndBook) {
      notifyLoanStatusChange({
        email: memberAndBook.email,
        namaAnggota: memberAndBook.namaAnggota,
        judulBuku: memberAndBook.judulBuku,
        kdTransaksi: created.kdTransaksi,
        status: created.status,
        tglPinjam: formatIndonesianDate(created.tglPinjam),
        tglKembali: formatIndonesianDate(created.tglKembali),
      });
    }
  }

  return created;
};

export const updateExistingTransaction = async (id: string, payload: UpdateTransaction) => {
  const existingTransaction = await findTransaction(id);
  if (!existingTransaction) return null;

  if (Object.keys(payload).length === 0) {
    return existingTransaction;
  }

  const updateData: Partial<TransactionInsert> = { ...payload };
  const updated = await updateTransactionById(id, updateData);

  if (updated && payload.status && payload.status !== existingTransaction.status) {
    const [memberAndBook] = await db
      .select({
        namaAnggota: members.nama,
        email: members.email,
        judulBuku: books.judul,
      })
      .from(members)
      .innerJoin(transactions, eq(transactions.anggotaId, members.id))
      .innerJoin(books, eq(transactions.bukuId, books.id))
      .where(eq(transactions.id, id))
      .limit(1);

    if (memberAndBook) {
      notifyLoanStatusChange({
        email: memberAndBook.email,
        namaAnggota: memberAndBook.namaAnggota,
        judulBuku: memberAndBook.judulBuku,
        kdTransaksi: updated.kdTransaksi,
        status: updated.status,
        tglPinjam: formatIndonesianDate(updated.tglPinjam),
        tglKembali: formatIndonesianDate(updated.tglKembali),
      });
    }
  }

  return updated;
};

export const deleteExistingTransaction = async (id: string) => {
  return removeTransactionById(id);
};
