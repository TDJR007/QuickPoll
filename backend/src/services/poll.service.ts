// backend/src/services/poll.services.ts

import { prisma } from '../../prisma/client';
import { AppError } from '../utils/AppError';
import { CreatePollInput } from '../validators/poll.validator';

export const createPoll = async (userId: string, input: CreatePollInput) => {
  // SQL: INSERT INTO "Poll" (id, "userId", question, "createdAt")
  //      VALUES (gen_random_uuid(), $1, $2, now())
  //      RETURNING *;
  //
  //      -- then for each option:
  //      INSERT INTO "Option" (id, "pollId", text, "createdAt")
  //      VALUES (gen_random_uuid(), $1, $2, now())
  //      RETURNING *;
  //
  //      -- Prisma wraps both in a transaction so either all inserts
  //      succeed or none do
  const poll = await prisma.poll.create({
    data: {
      userId,
      question: input.question,
      options: {
        create: input.options.map((text) => ({ text })),
      },
    },
    include: {
      options: {
        select: {
          id: true,
          text: true,
        },
      },
    },
  });

  return poll;
};

export const getPoll = async (pollId: string) => {
  // SQL: SELECT p.*, o.id, o.text, COUNT(v."optionId") as vote_count
  //      FROM "Poll" p
  //      LEFT JOIN "Option" o ON o."pollId" = p.id
  //      LEFT JOIN "Vote" v ON v."optionId" = o.id
  //      WHERE p.id = $1
  //      GROUP BY p.id, o.id
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      options: {
        select: {
          id: true,
          text: true,
          _count: {
            select: { votes: true },
          },
        },
      },
    },
  });

  if (!poll) {
    throw new AppError('Poll not found', 404, 'POLL_NOT_FOUND');
  }

  return poll;
};

/*
    📌 Two things worth noting. First, the nested create inside prisma.poll.create 
    — Prisma wraps the poll insert and all option inserts in a single transaction automatically.
    Either everything lands or nothing does. In raw SQL you'd have to manually write BEGIN, COMMIT, ROLLBACK. 
    Second, _count: { select: { votes: true } } is Prisma's way of doing a COUNT
    — it adds a _count object to each option with the vote tally, which is exactly what we need for results.
*/