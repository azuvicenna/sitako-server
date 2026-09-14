import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '@/utils/auth/jwt';
import { sendError, sendFail } from '@/utils/core/handler';

export const verifyAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token;

    if (typeof token !== 'string' || !token.trim()) {
      return sendFail(res, 401, 'Akses ditolak. Belum login.');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return sendFail(res, 401, 'Sesi tidak valid atau kedaluwarsa.');
    }

    req.user = decoded;
    return next();
  } catch (error) {
    return sendError(res, error, 'verifyAuth');
  }
};
