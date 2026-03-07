// backend/src/utils/redis.ts

import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

const redis = new Redis(env.REDIS_URL);

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  logger.error({ err }, 'Redis error');
});

export default redis;

/*
    📌 Same singleton pattern as Prisma — one Redis connection shared across the app.
    We attach event listeners for `connect` and `error` so Redis problems show up in your logs immediately 
    rather than silently failing.
    `ioredis` also handles reconnection automatically if Redis goes down and comes back up — you don't have to write any retry logic yourself.
*/
