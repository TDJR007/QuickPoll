// src/middleware/requestLogger.ts

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  const start = Date.now();

  req.requestId = requestId;

  logger.info({
    requestId,
    method: req.method,
    url: req.url,
  }, 'incoming request');

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    }, 'request completed');
  });

  next();
};

/*
    📌 The res.on('finish') pattern is how you log AFTER the response is sent
    — so you can capture the status code and duration. 
    You can't know those things before the handler runs.
    Also notice we're attaching requestId to the req object so any handler down the line can grab it
    — this is how request tracing works in real systems.
*/