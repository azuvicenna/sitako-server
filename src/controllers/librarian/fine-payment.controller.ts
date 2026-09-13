import { Request, Response } from "express";
import * as finePaymentService from "@/services/librarian/fine-payment.service";
import { resolveParam } from "@/utils/core/param";
import {
  getPaginationParams,
  sendError,
  sendFail,
  sendSuccess,
} from "@/utils/core/handler";

export const getFinePaymentsHandler = async (req: Request, res: Response) => {
  try {
    const { page, limit, search } = getPaginationParams(req.query);
    const result = await finePaymentService.getFinePaymentsWithPagination(
      page,
      limit,
      search,
    );

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error, "getFinePaymentsHandler");
  }
};

export const showFinePayment = async (req: Request, res: Response) => {
  try {
    const paymentId = resolveParam(req.params.id);

    if (!paymentId) {
      return sendFail(res, 400, "ID pembayaran denda tidak valid");
    }

    const result = await finePaymentService.getFinePaymentById(paymentId);
    if (!result) {
      return sendFail(res, 404, "Data pembayaran denda tidak ditemukan");
    }

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error, "showFinePayment");
  }
};

export const createFinePayment = async (req: Request, res: Response) => {
  try {
    const result = await finePaymentService.createNewFinePayment(
      req.body ?? {},
    );

    return sendSuccess(res, result, "Pembayaran denda berhasil dicatat");
  } catch (error) {
    return sendError(res, error, "createFinePayment");
  }
};

export const updateFinePayment = async (req: Request, res: Response) => {
  try {
    const paymentId = resolveParam(req.params.id);

    if (!paymentId) {
      return sendFail(res, 400, "ID pembayaran denda tidak valid");
    }

    const result = await finePaymentService.updateExistingFinePayment(
      paymentId,
      req.body ?? {},
    );

    if (!result) {
      return sendFail(res, 404, "Data pembayaran denda tidak ditemukan");
    }

    return sendSuccess(
      res,
      result,
      "Data pembayaran denda berhasil diperbarui",
    );
  } catch (error) {
    return sendError(res, error, "updateFinePayment");
  }
};

export const deleteFinePayment = async (req: Request, res: Response) => {
  try {
    const paymentId = resolveParam(req.params.id);

    if (!paymentId) {
      return sendFail(res, 400, "ID pembayaran denda tidak valid");
    }

    const result =
      await finePaymentService.deleteExistingFinePayment(paymentId);

    if (!result) {
      return sendFail(res, 404, "Data pembayaran denda tidak ditemukan");
    }

    return sendSuccess(res, result, "Data pembayaran denda berhasil dihapus");
  } catch (error) {
    return sendError(res, error, "deleteFinePayment");
  }
};
