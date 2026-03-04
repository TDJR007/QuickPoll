// backend/src/validators/poll.validator.ts

import { z } from 'zod';

export const createPollSchema = z.object({
  question: z.string().min(1, 'Question is required').max(500, 'Question too long'),
  options: z
    .array(z.string().min(1, 'Option cannot be empty').max(200, 'Option too long'))
    .min(2, 'Poll must have at least 2 options')
    .max(10, 'Poll cannot have more than 10 options'),
});

export type CreatePollInput = z.infer<typeof createPollSchema>;

/*
  📌 We cap options at 10 — not in the spec but it's a good defensive boundary. 
  Without it someone could send an array of 10,000 options and you'd try to insert them all.
  Always think about the upper bound on arrays coming from user input, not just the lower bound.
*/