// src/backend/validators

import { z } from 'zod';

export const castVoteSchema = z.object({
  optionId: z.uuid('Invalid option ID'),
});

export type CastVoteInput = z.infer<typeof castVoteSchema>;

/*
    📌 Tiny validator but notice we're using z.string().uuid() instead of just z.string()
    — this means garbage like "abc123" gets rejected before it ever hits the DB.
    Always validate the shape of IDs coming from the client, not just their presence. 
    A uuid that doesn't exist in the DB is handled by the service, but a string that couldn't possibly be a uuid gets stopped right here.
*/