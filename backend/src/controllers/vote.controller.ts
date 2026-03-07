// backend/src/controllers/vote.controller.ts

import { Request, Response, NextFunction } from 'express';
import { castVoteSchema } from '../validators/vote.validator';
import { castVote, getPollResults } from '../services/vote.service';

export const castVoteHandler = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: pollId } = req.params;
    const input = castVoteSchema.parse(req.body);
    const vote = await castVote(req.userId, pollId, input);
    res.status(200).json(vote);
  } catch (err) {
    next(err);
  }
};

export const getPollResultsHandler = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: pollId } = req.params;
    const results = await getPollResults(pollId);
    res.status(200).json(results);
  } catch (err) {
    next(err);
  }
};

/*
    📌 Notice we're using Request<{ id: string }> again — same pattern as the poll controller.
    Once you've seen a pattern used twice it's worth remembering. 
    Any route with URL params gets typed this way in Express + TypeScript.
*/