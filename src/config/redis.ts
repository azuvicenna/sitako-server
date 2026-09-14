import { createClient } from 'redis';

import logger from '@/utils/core/logger';

export type RedisClient = ReturnType<typeof createClient>;

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || '6379';
const REDIS_URL = process.env.REDIS_URL || `redis://${redisHost}:${redisPort}`;

const redisClient: RedisClient = createClient({
  url: REDIS_URL,
});

redisClient.on('error', (error: unknown): void => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown Error';

  logger.error(`Redis Client Error: ${errorMessage}`, { error });
});

export const connectRedis = async (): Promise<void> => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

export default redisClient;
