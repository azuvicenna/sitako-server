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
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || true,
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
