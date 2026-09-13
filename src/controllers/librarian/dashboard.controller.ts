import { Request, Response } from "express";
import {
  getDashboardSummaryService,
  getTodayTransactionsService,
  getWeeklyStatisticsService,
} from "@/services/librarian/dashboard.service";
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

export const getSummary = async (_req: Request, res: Response) => {
  try {
    const result = await getDashboardSummaryService();
    return sendSuccess(res, result, "Ringkasan dashboard berhasil diambil");
  } catch (error) {
    return sendError(res, error, "getSummary");
  }
};

export const getTodayTransactions = async (req: Request, res: Response) => {
  try {
    const rawStatus = req.query.status;
    const status =
      typeof rawStatus === "string" && rawStatus.trim()
        ? rawStatus.trim()
        : "Semua";

    if (!isValidStatus(status)) {
      return sendFail(res, 400, "Status transaksi tidak valid");
    }

    const { page, limit } = getPaginationParams(req.query);
    const result = await getTodayTransactionsService(page, limit, status);

    return sendSuccess(res, result, "Data transaksi hari ini berhasil diambil");
  } catch (error) {
    return sendError(res, error, "getTodayTransactions");
  }
};

export const getWeeklyStatistics = async (_req: Request, res: Response) => {
  try {
    const result = await getWeeklyStatisticsService();
    return sendSuccess(res, result, "Statistik mingguan berhasil diambil");
  } catch (error) {
    return sendError(res, error, "getWeeklyStatistics");
  }
};
