import redisClient, { connectRedis } from '@/config/redis';
import { clearCacheByPattern } from '@/utils/core/cache';

afterAll(async () => {
  if (redisClient.isOpen) {
    await redisClient.disconnect();
  }
});

describe('Redis Integration Test', () => {
  it('should connect to Redis successfully', async () => {
    await expect(connectRedis()).resolves.not.toThrow();
    expect(redisClient.isOpen).toBe(true);
  });

  it('should be able to set and get a value', async () => {
    const testKey = 'integration-test-key';
    const testValue = 'halo-redis';

    await redisClient.set(testKey, testValue);
    const result = await redisClient.get(testKey);

    expect(result).toBe(testValue);

    await redisClient.del(testKey);
  });
});

beforeAll(async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
});

afterAll(async () => {
  if (redisClient.isOpen) {
    await redisClient.disconnect();
  }
});

describe('clearCacheByPattern Integration Test', () => {
  it('should clear keys matching a single string pattern', async () => {
    await redisClient.set('test-cache:user:1', 'data1');
    await redisClient.set('test-cache:user:2', 'data2');
    await redisClient.set('test-keep:user:1', 'safe-data');

    await clearCacheByPattern('test-cache:*');

    const deleted1 = await redisClient.get('test-cache:user:1');
    const deleted2 = await redisClient.get('test-cache:user:2');
    const kept = await redisClient.get('test-keep:user:1');

    expect(deleted1).toBeNull();
    expect(deleted2).toBeNull();
    expect(kept).toBe('safe-data');

    await redisClient.del('test-keep:user:1');
  });

  it('should clear keys matching multiple patterns from an array', async () => {
    await redisClient.set('test-group-a:1', 'data');
    await redisClient.set('test-group-b:1', 'data');
    await redisClient.set('test-group-c:1', 'safe-data');

    await clearCacheByPattern(['test-group-a:*', 'test-group-b:*']);

    const deletedA = await redisClient.get('test-group-a:1');
    const deletedB = await redisClient.get('test-group-b:1');
    const keptC = await redisClient.get('test-group-c:1');

    expect(deletedA).toBeNull();
    expect(deletedB).toBeNull();
    expect(keptC).toBe('safe-data');

    await redisClient.del('test-group-c:1');
  });

  it('should not error if an empty array is passed', async () => {
    await expect(clearCacheByPattern([])).resolves.not.toThrow();
  });
});
