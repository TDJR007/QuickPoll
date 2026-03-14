// backend/prisma/client.ts

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env';

const connectionString = env.DATABASE_URL;

const adapter = new PrismaPg({
    connectionString,
    // Optional: tune pool size if needed (default is fine for dev)
    // max: 10,
  });

// Singleton pattern
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,                    // ← this is the required piece
    log: ['query', 'info', 'warn', 'error'], // optional: see SQL in console during dev
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/*
    📌 We only instantiate PrismaClient once and export it as a singleton. 
    If you created new PrismaClient() in every file you'd exhaust your DB connection pool fast. 
    One instance, shared everywhere — real pattern.
*/