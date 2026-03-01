// backend/src/controllers/auth.controller.ts

import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { registerUser, loginUser } from '../services/auth.service';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await registerUser(input);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await loginUser(input);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/*
    📌 Controller is intentionally thin — no business logic, no DB calls, no error handling beyond next(err).
    The controller's only job is to take the request, hand it to the service, and send back the response.
    If something throws — Zod validation error, AppError, anything — it falls straight into the central error handler we built. 
    This is the whole point of clean layering: each layer has one job.


    Q: What is NextFunction?

    `NextFunction` is Express's way of passing control to the next middleware in the chain. When you call `next(err)` with an argument, Express knows something went wrong and skips all regular middleware, jumping straight to the error handler — which is why our `errorHandler` in 2d catches everything.
    Without it you'd have to handle every error in every controller yourself. With it you just go `next(err)` and the central handler takes over.
    Think of the request as a baton in a relay race:

    ```
    requestLogger → route handler → controller → (error?) → errorHandler
    ```

    `next()` passes the baton forward. `next(err)` throws the baton to the error handler directly, skipping everyone else in line.
    That's also why `errorHandler` has 4 arguments `(err, req, res, next)` — that's how Express recognizes it as the error destination specifically, not a regular middleware stop.
*/