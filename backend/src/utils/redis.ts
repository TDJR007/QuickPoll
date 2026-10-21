
// backend/src/utils/redis.ts

import Redis from 'ioredis';
import NodeCache from 'node-cache';
import { env } from './env';
import { logger } from './logger';

let redis: Redis | null = null;
let isRedisAvailable = false;

if (env.REDIS_URL && env.REDIS_URL.trim() !== '') {
  try {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 5000,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('Redis reconnection stopped after 3 attempts. Operating with NodeCache fallback.');
          return null; // stop reconnecting
        }
        return Math.min(times * 1000, 3000);
      },
    });

    redis.on('connect', () => {
      isRedisAvailable = true;
      logger.info('Redis connected');
    });

    redis.on('ready', () => {
      isRedisAvailable = true;
    });

    redis.on('close', () => {
      isRedisAvailable = false;
    });

    redis.on('end', () => {
      isRedisAvailable = false;
    });

    redis.on('error', (err) => {
      isRedisAvailable = false;
      logger.warn({ err: err.message }, 'Redis unavailable — continuing with fallback');
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.warn({ err: errorMsg }, 'Failed to initialize Redis client — continuing without Redis');
    redis = null;
    isRedisAvailable = false;
  }
} else {
  logger.info('REDIS_URL not configured. Running with NodeCache.');
}

export default redis;

// In-memory fallback using NodeCache with automatic eviction
const localCache = new NodeCache({
  stdTTL: 300, // default 5 min TTL
  checkperiod: 60, // delete expired keys every 60s
  useClones: false,
});

export const cache = {
  async get(key: string): Promise<string | null> {
    if (redis && isRedisAvailable) {
      try {
        return await redis.get(key);
      } catch (err) {
        logger.warn({ err: (err as Error).message }, 'Redis get failed, falling back to local cache');
      }
    }

    const value = localCache.get<string>(key);
    return value ?? null;
  },

  async set(key: string, value: string, mode?: 'EX', ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds && ttlSeconds > 0 ? ttlSeconds : 300;

    if (redis && isRedisAvailable) {
      try {
        if (mode === 'EX' && ttlSeconds) {
          await redis.set(key, value, 'EX', ttlSeconds);
        } else {
          await redis.set(key, value);
        }
      } catch (err) {
        logger.warn({ err: (err as Error).message }, 'Redis set failed, falling back to local cache');
      }
    }

    localCache.set(key, value, ttl);
  },

  async del(key: string): Promise<void> {
    localCache.del(key);

    if (redis && isRedisAvailable) {
      try {
        await redis.del(key);
      } catch (err) {
        logger.warn({ err: (err as Error).message }, 'Redis del failed');
      }
    }
  },
};

