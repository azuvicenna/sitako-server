import { NextFunction, Request, Response } from 'express';
import { ZodError, z } from 'zod';
import { sendError } from '@/utils/core/handler';

type Source = 'body' | 'query' | 'params';

export const validate = (schema: z.ZodType, source: Source = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req[source]);

      if (source === 'query' || source === 'params') {
        Object.defineProperty(req, source, {
          value: parsed,
          writable: true,
          configurable: true,
        });
      } else {
        req[source] = parsed;
      }

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validasi gagal',
          errors: error.issues.map((err) => ({
            field: err.path.join('.') || 'root',
            message: err.message,
          })),
        });
      }

      return sendError(res, error, 'validate');
    }
  };
};
