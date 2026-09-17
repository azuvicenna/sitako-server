import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

import { metricsHandler, metricsMiddleware } from '@/middlewares/matrics.middleware';
import { requestLogger } from '@/middlewares/request-logger.middleware';
import routes from '@/routes';
import logger from '@/utils/core/logger';
import { sendFail } from '@/utils/core/handler';

const app: Application = express();

app.set('trust proxy', 1);
app.use(metricsMiddleware);
app.use(helmet());
const allowedOriginsConfig = process.env.ALLOWED_ORIGIN;
const parsedAllowedOrigins = allowedOriginsConfig
  ? allowedOriginsConfig.split(',').map((origin) => origin.trim().replace(/\/$/, ''))
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Izinkan request tanpa origin (seperti aplikasi mobile, curl, Postman)
      if (!origin) {
        return callback(null, true);
      }

      // Jika ALLOWED_ORIGIN tidak diset atau berisi wildcard "*", refleksikan origin agar kompatibel dengan credentials: true
      if (!allowedOriginsConfig || allowedOriginsConfig.trim() === '*') {
        return callback(null, true);
      }

      const normalizedOrigin = origin.trim().replace(/\/$/, '');
      if (parsedAllowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      // Izinkan akses jika origin berasal dari localhost atau IP private (berguna untuk VM Multipass / dev)
      if (/^https?:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(normalizedOrigin)) {
        return callback(null, true);
      }

      logger.warn(`[CORS] Origin diblokir: ${origin}`);
      return callback(new Error(`Origin ${origin} tidak diizinkan oleh kebijakan CORS`), false);
    },
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

app.get('/', (_req: Request, res: Response): void => {
  res.status(200).send('SITAKO API is running!');
});

app.get('/metrics', metricsHandler);

app.use('/api', routes);

app.use((err: Error, _req: Request, res: Response, next: NextFunction): void => {
  if (res.headersSent) {
    return next(err);
  }

  logger.error(err.message, { stack: err.stack });

  sendFail(res, 500, 'Terjadi kesalahan pada server');
});

export default app;
