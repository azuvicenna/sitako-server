import { Request, Response } from "express";
import * as transactionService from "@/services/member/transaction.service";
import { kembalikanBuku } from "@/services/member/return.service";
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

export const getMyTransactions = async (req: Request, res: Response) => {
  try {
    const memberId = req.user?.id;
    if (!memberId) {
      return sendFail(res, 401, "Pengguna tidak terautentikasi");
    }

    const { status } = req.query;
    if (!isValidStatus(status)) {
      return sendFail(res, 400, "Status transaksi tidak valid");
    }

    const { page, limit, search } = getPaginationParams(req.query);
    const result = await transactionService.getTransactionsWithPagination(
      memberId,
      status,
      page,
      limit,
      search,
    );

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error, "getMyTransactions");
  }
};

export const showMyTransaction = async (req: Request, res: Response) => {
  try {
    const transactionId = resolveParam(req.params.id);
    if (!transactionId) {
      return sendFail(res, 400, "ID transaksi tidak valid");
    }

    const memberId = req.user?.id;
    if (!memberId) {
      return sendFail(res, 401, "Pengguna tidak terautentikasi");
    }

    const result = await transactionService.getTransactionById(
      transactionId,
      memberId,
    );

    if (!result) {
      return sendFail(res, 404, "Data transaksi tidak ditemukan");
    }

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error, "showMyTransaction");
  }
};

export const createMyTransaction = async (req: Request, res: Response) => {
  try {
    const memberId = req.user?.id;
    if (!memberId) {
      return sendFail(res, 401, "Pengguna tidak terautentikasi");
    }

    const body = req.body ?? {};

    const validationResult = await validateTransactionCreation(
      memberId,
      body.bukuId,
    );

    if (!validationResult.success) {
      return sendFail(
        res,
        400,
        validationResult.message ?? "Validasi transaksi gagal",
      );
    }

    const result = await transactionService.createNewTransaction(
      memberId,
      body,
    );

    return sendSuccess(res, result, "Transaksi berhasil dibuat");
  } catch (error) {
    return sendError(res, error, "createMyTransaction");
  }
};

export const returnMyTransaction = async (req: Request, res: Response) => {
  try {
    const transactionId = resolveParam(req.params.id);
    if (!transactionId) {
      return sendFail(res, 400, "ID transaksi tidak valid");
    }

    const memberId = req.user?.id;
    if (!memberId) {
      return sendFail(res, 401, "Pengguna tidak terautentikasi");
    }

    const { isBukuHilang = false } = req.body ?? {};

    const result = await kembalikanBuku(
      transactionId,
      memberId,
      Boolean(isBukuHilang),
    );

    if (!result) {
      return sendFail(res, 404, "Data transaksi tidak ditemukan");
    }

    return sendSuccess(res, result, result.pesan);
  } catch (error: any) {
    if (error?.statusCode === 422) {
      return sendFail(res, 422, error.message);
    }
    return sendError(res, error, "returnMyTransaction");
  }
};
