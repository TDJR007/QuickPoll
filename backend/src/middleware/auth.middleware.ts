// backend/src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../utils/env';
import { AppError } from '../utils/AppError';

interface JwtPayload {
  userId: string;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Missing or invalid authorization header', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.userId = payload.userId;
    next();
  } catch (err) {
    next(new AppError('Invalid or expired token', 401, 'INVALID_TOKEN'));
  }
};

/*
    📌 The Bearer  prefix is part of the HTTP Authorization header standard.
    The pattern is Authorization: Bearer <token> — splitting on space and taking index [1] peels the token out.
    You'll see this pattern in every JWT implementation everywhere.
*/