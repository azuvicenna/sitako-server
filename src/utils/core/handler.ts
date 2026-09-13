import { Response } from "express";

import logger from "./logger";

export interface PaginationParams {
  page: number;
  limit: number;
  search: string;
}

export const getPaginationParams = (
  query: Record<string, unknown>,
): PaginationParams => ({
  page: Math.max(1, Number.parseInt(String(query.page ?? ""), 10) || 1),
  limit: Math.max(1, Number.parseInt(String(query.limit ?? ""), 10) || 10),
  search: typeof query.search === "string" ? query.search : "",
});

export const sendSuccess = <T extends object = object>(
  res: Response,
  data?: T | null,
  message = "Data retrieved successfully",
): Response => {
  return res.status(200).json({
    success: true,
    message,
    ...(data ?? {}),
  });
};

export const sendError = (
  res: Response,
  error: unknown,
  context: string,
): Response => {
  const errorMessage = error instanceof Error ? error.message : "Unknown Error";

  logger.error(`Error pada ${context}: ${errorMessage}`, { error });

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

export const sendFail = (
  res: Response,
  statusCode: number,
  message: string,
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};
