import redisClient from "@/config/redis";

export async function clearCacheByPattern(
  pattern: string | string[],
): Promise<void> {
  const rawPatterns = Array.isArray(pattern) ? pattern : [pattern];
  const patterns = Array.from(new Set(rawPatterns.filter(Boolean)));

  if (patterns.length === 0) {
    return;
  }

  await Promise.all(patterns.map((p) => clearSinglePattern(p)));
}

async function clearSinglePattern(pattern: string): Promise<void> {
  let cursor = "0";

  do {
    const { cursor: nextCursor, keys } = await redisClient.scan(cursor, {
      MATCH: pattern,
      COUNT: 100,
    });

    cursor = String(nextCursor);

    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } while (cursor !== "0");
}
