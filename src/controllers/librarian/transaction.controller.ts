import { Request, Response } from "express";
import * as transactionService from "@/services/librarian/transaction.service";
import { validateTransactionCreation } from "@/services/librarian/transaction-validation.service";
import { resolveParam } from "@/utils/core/param";
import {
  getPaginationParams,
  sendError,
  sendFail,
  sendSuccess,
} from "@/utils/core/handler";
import { transactionStatusEnum } from "@/db/schema";

const VALID_STATUSES = ["Semua", ...transactionStatusEnum.enumValues] as const;
type TransactionStatusFilter = (typeof VALID_STATUSES)[number];

const isValidStatus = (status: unknown): status is TransactionStatusFilter => {
  return (
    typeof status === "string" &&
    (VALID_STATUSES as readonly string[]).includes(status)
  );
};

export const getTransactionsHandler = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    if (!isValidStatus(status)) {
      return sendFail(res, 400, "Status transaksi tidak valid");
    }

    const { page, limit, search } = getPaginationParams(req.query);
    const result = await transactionService.getTransactionsWithPagination(
      status,
      page,
      limit,
      search,
    );

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error, "getTransactionsHandler");
  }
};

export const showTransaction = async (req: Request, res: Response) => {
  try {
    const transactionId = resolveParam(req.params.id);

    if (!transactionId) {
      return sendFail(res, 400, "ID transaksi tidak valid");
    }

    const result = await transactionService.getTransactionById(transactionId);
    if (!result) {
      return sendFail(res, 404, "Data transaksi tidak ditemukan");
    }

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error, "showTransaction");
  }
};

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};

    const validationResult = await validateTransactionCreation(
      body.anggotaId,
      body.bukuId,
    );
    if (!validationResult.success) {
      return sendFail(
        res,
        400,
        validationResult.message ?? "Validasi transaksi gagal",
      );
    }

    const result = await transactionService.createNewTransaction(body);

    return sendSuccess(res, result, "Transaksi berhasil dibuat");
  } catch (error) {
    return sendError(res, error, "createTransaction");
  }
};

export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const transactionId = resolveParam(req.params.id);

    if (!transactionId) {
      return sendFail(res, 400, "ID transaksi tidak valid");
    }

    const result = await transactionService.updateExistingTransaction(
      transactionId,
      req.body ?? {},
    );

    if (!result) {
      return sendFail(res, 404, "Data transaksi tidak ditemukan");
    }

    return sendSuccess(res, result, "Data transaksi berhasil diperbarui");
  } catch (error) {
    return sendError(res, error, "updateTransaction");
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const transactionId = resolveParam(req.params.id);

    if (!transactionId) {
      return sendFail(res, 400, "ID transaksi tidak valid");
    }

    const result =
      await transactionService.deleteExistingTransaction(transactionId);

    if (!result) {
      return sendFail(res, 404, "Data transaksi tidak ditemukan");
    }

    return sendSuccess(res, result, "Data transaksi berhasil dihapus");
  } catch (error) {
    return sendError(res, error, "deleteTransaction");
  }
};
