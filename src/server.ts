import app from '@/app';
import { connectRedis } from '@/config/redis';
import logger from '@/utils/core/logger';
import { initSchedulers } from '@/jobs';

const PORT: number = Number(process.env.PORT) || 8080;

const startServer = async (): Promise<void> => {
  try {
    await connectRedis();
    logger.info('Connected to Redis successfully');
  } catch (error) {
    logger.error(
      `Failed to connect to Redis: ${error instanceof Error ? error.message : 'Unknown Error'}`,
    );
  }

  // Initialize background jobs & schedulers
  await initSchedulers();

  app.listen(PORT, (): void => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
};

void startServer();
