// src/backend/controllers/poll.controllers.ts

import { Request, Response, NextFunction } from 'express';
import { createPollSchema } from '../validators/poll.validator';
import { createPoll, getPoll } from '../services/poll.service';

export const createPollHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createPollSchema.parse(req.body);
    const poll = await createPoll(req.userId, input);
    res.status(201).json(poll);
  } catch (err) {
    next(err);
  }
};

export const getPollHandler = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const poll = await getPoll(id);
      res.status(200).json(poll);
    } catch (err) {
      next(err);
    }
  };

/*
    📌 Notice req.userId works here without any extra lookup — 
    the authenticate middleware we built in 3e already verified the JWT and attached the userId to the request before this controller ever runs.
    By the time we're here we know exactly who's making the request. 
    That's middleware composition doing its job.
*/