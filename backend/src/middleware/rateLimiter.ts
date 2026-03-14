// backend/src/middleware/rateLimiter.ts

import { rateLimit } from 'express-rate-limit';
import { env } from '../utils/env';

const isProd = env.NODE_ENV === 'production';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProd,
  message: {
    error: 'Too many auth attempts, please try again later.',
  },
});

export const pollLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProd,
  message: {
    error: 'Too many polls created, please try again later.',
  },
});

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProd,
  message: {
    error: 'Too many requests, please try again later.',
  },
});

/*
    📌 A few things here. skip: () => !isProd means rate limiting only activates in production — in dev you'd constantly hit limits while testing and lose your mind.
    standardHeaders: true adds RateLimit-Limit, RateLimit-Remaining, and RateLimit-Reset headers to every response so the client knows exactly where they stand.
    makeStore is a factory so each limiter gets its own Redis key prefix — rl:auth:, rl:global: etc — they don't interfere with each other or your poll cache keys.
*/