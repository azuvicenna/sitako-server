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

export const verifyRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.role) {
        return sendFail(res, 401, 'Akses ditolak. Pengguna belum terautentikasi.');
      }

      const userRole = req.user.role.toLowerCase();
      const isAllowed = allowedRoles.some((role) => role.toLowerCase() === userRole);

      if (!isAllowed) {
        return sendFail(res, 403, 'Akses ditolak. Anda tidak memiliki izin.');
      }

      return next();
    } catch (error) {
      return sendError(res, error, 'verifyRole');
    }
  };
};

