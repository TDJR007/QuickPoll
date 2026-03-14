// backend/prisma/client.ts

import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { env } from './env';

const connectionString = env.DATABASE_URL;

const adapter = new PrismaNeon({
  connectionString: env.DATABASE_URL,
});

// Singleton pattern
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// export const prisma =
//   globalForPrisma.prisma ||
//   new PrismaClient({
//     adapter,                    // ← this is the required piece
//     log: ['query', 'info', 'warn', 'error'], // optional: see SQL in console during dev
//   });

  export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter, // ← this is the required piece
    log: env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'], // see SQL in console during dev but only errors in prod
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/*
    📌 We only instantiate PrismaClient once and export it as a singleton. 
    If you created new PrismaClient() in every file you'd exhaust your DB connection pool fast. 
    One instance, shared everywhere — real pattern.
*/

/*
    📌 We swap @prisma/adapter-pg for @prisma/adapter-neon because Neon has its own optimized serverless driver that handles connection pooling and cold starts better than raw pg in a serverless/hosted environment.
    Also notice we only log queries in development now — in production you don't want every SQL query flooding your logs
*/