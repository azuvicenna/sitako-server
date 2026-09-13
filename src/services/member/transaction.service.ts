import {
  insertTransaction,
  findTransaction,
  findTransactionsWithPagination,
  type TransactionInsert,
} from "@/repositories/member/transaction.repository";
import type { CreateTransaction } from "@/validations/member/transaction.schema";
import { generateTransactionCode } from "@/utils/generators/transaction-code";

export const getTransactionsWithPagination = async (
  memberId: string,
  status: string,
  page: number,
  limit: number,
  search: string,
) => {
  return findTransactionsWithPagination(memberId, status, page, limit, search);
};

export const getTransactionById = async (id: string, memberId: string) => {
  return findTransaction(id, memberId);
};

export const createNewTransaction = async (
  memberId: string,
  payload: CreateTransaction,
) => {
  const transactionData: TransactionInsert = {
    ...payload,
    anggotaId: memberId,
    kdTransaksi: generateTransactionCode(),
  };

  return insertTransaction(transactionData);
};
