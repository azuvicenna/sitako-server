import redisClient from '@/config/redis';
import logger from '@/utils/core/logger';

export interface PaginationMeta {
  page: number;
  limit: number;
  totalRows: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export const withCache = async <T>(
  cacheKey: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> => {
  const cached = await redisClient.get(cacheKey);

  if (cached) {
    logger.debug(`Cache hit: ${cacheKey}`);
    try {
      return JSON.parse(cached) as T;
    } catch {
      logger.warn(`Failed to parse cache for key: ${cacheKey}`);
    }
  }

  logger.debug(`Cache miss: ${cacheKey}`);

  const data = await fetcher();

  if (data !== undefined) {
    await redisClient.setEx(cacheKey, ttlSeconds, JSON.stringify(data));
  }

  return data;
};

export const withCacheAndPagination = async <T>(
  cacheKey: string,
  page: number,
  limit: number,
  fetchData: (offset: number, limit: number) => Promise<{ data: T[]; total: number }>,
  ttlSeconds = 60,
): Promise<PaginatedResult<T>> => {
  return withCache(cacheKey, ttlSeconds, async (): Promise<PaginatedResult<T>> => {
    const safeLimit = Math.max(1, limit);
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * safeLimit;

    const { data, total } = await fetchData(offset, safeLimit);
    const totalPages = Math.ceil(total / safeLimit);

    return {
      data,
      meta: {
        page: safePage,
        limit: safeLimit,
        totalRows: total,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    };
  });
};
