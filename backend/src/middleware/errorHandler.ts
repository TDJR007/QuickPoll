// backend/src/middleware/errorHandler.ts

import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { prisma } from '../../prisma/client';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.requestId ?? 'unknown';

  // Zod validation error
  if (err instanceof ZodError) {
    const flattened = z.flattenError(err);

    logger.warn(
      { requestId, errors: flattened.fieldErrors },
      'validation error'
    );

    res.status(400).json({
      error: 'Validation failed',
      fields: flattened.fieldErrors,   // same as before: { fieldName: ["error msg 1", "error msg 2"] }
      formErrors: flattened.formErrors, // optional: include if you have top-level errors
      requestId,
    });
    return;
  }

  // Known app error
  if (err instanceof AppError) {
    logger.warn({ requestId, code: err.code, message: err.message }, 'app error');
    res.status(err.statusCode).json({
      error: err.message,
      requestId,
    });
    return;
  }

  // Unknown error
  logger.error({ requestId, err }, 'unexpected error');

  // Attempt DB log — fire and forget
  prisma.log
    .create({
      data: {
        requestId,
        level: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
        metadata: { stack: err instanceof Error ? err.stack : null },
      },
    })
    .catch(() => {});

  res.status(500).json({
    error: 'Internal server error',
    requestId,
  });
};