import {
  insertTransaction,
  updateTransactionById,
  findTransaction,
  removeTransactionById,
  findTransactionsWithPagination,
  type TransactionInsert,
} from "@/repositories/librarian/transaction.repository";
import { generateTransactionCode } from "@/utils/generators/transaction-code";
import type {
  CreateTransaction,
  UpdateTransaction,
} from "@/validations/librarian/transaction.schema";

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
    status: "Dipinjam",
  };

  return insertTransaction(transactionData);
};

export const updateExistingTransaction = async (
  id: string,
  payload: UpdateTransaction,
) => {
  const existingTransaction = await findTransaction(id);
  if (!existingTransaction) return null;

  if (Object.keys(payload).length === 0) {
    return existingTransaction;
  }

  const updateData: Partial<TransactionInsert> = { ...payload };
  return updateTransactionById(id, updateData);
};

export const deleteExistingTransaction = async (id: string) => {
  return removeTransactionById(id);
};
