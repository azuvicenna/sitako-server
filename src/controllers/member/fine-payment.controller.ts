import { Request, Response } from "express";
import * as finePaymentService from "@/services/member/fine-payment.service";
import { resolveParam } from "@/utils/core/param";
import {
  getPaginationParams,
  sendError,
  sendFail,
  sendSuccess,
} from "@/utils/core/handler";

export const getFinePaymentsHandler = async (req: Request, res: Response) => {
  try {
    const memberId = req.user?.id;
    if (!memberId) {
      return sendFail(res, 401, "Pengguna tidak terautentikasi");
    }

    const { page, limit, search } = getPaginationParams(req.query);
    const result = await finePaymentService.getFinePaymentsWithPagination(
      memberId,
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

    const memberId = req.user?.id;
    if (!memberId) {
      return sendFail(res, 401, "Pengguna tidak terautentikasi");
    }

    const result = await finePaymentService.getFinePaymentById(
      paymentId,
      memberId,
    );

    if (!result) {
      return sendFail(res, 404, "Data pembayaran denda tidak ditemukan");
    }

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, error, "showFinePayment");
  }
};

export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const memberId = req.user?.id;
    if (!memberId) {
      return sendFail(res, 401, "Pengguna tidak terautentikasi");
    }

    const { transaksiId: transactionId, paymentMethodCode } = req.body ?? {};

    const result = await finePaymentService.initiateOnlinePayment(
      memberId,
      transactionId,
      paymentMethodCode,
    );

    return sendSuccess(res, result, "Pembayaran berhasil diinisiasi");
  } catch (error) {
    return sendError(res, error, "initiatePayment");
  }
};
