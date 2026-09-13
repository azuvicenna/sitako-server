import { Request, Response, NextFunction } from "express";
import logger from "@/utils/core/logger";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.debug(`[${req.method}] ${req.originalUrl}`);
  next();
};
