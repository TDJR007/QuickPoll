// backend/src/types/express.d.ts

declare namespace Express {
    interface Request {
      requestId: string;
      userId: string;
    }
  }