// backend/src/routes/poll.routes.ts

import { Router } from 'express';
import { createPollHandler, getPollHandler } from '../controllers/poll.controller';
import { castVoteHandler, getPollResultsHandler } from '../controllers/vote.controller';
import { authenticate } from '../middleware/auth.middleware';
import { pollLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/', authenticate, pollLimiter, createPollHandler);
router.get('/:id', getPollHandler);
router.post('/:id/vote', authenticate, castVoteHandler);
router.get('/:id/results', getPollResultsHandler);

export default router;

/*
    📌 Notice authenticate sits right in the route definition as a second argument — 
    this is per-route middleware. POST /polls requires a token, GET /polls/:id is public, anyone can view a poll without logging in. 
    This matches the spec exactly. Clean and explicit — you can see the auth requirement just by glancing at the route file.
*/