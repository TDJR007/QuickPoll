import { prisma } from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { CastVoteInput } from '../validators/vote.validator';
import redis from '../utils/redis';

const CACHE_TTL = 60 * 5; // 5 minutes

const getCacheKey = (pollId: string) => `poll:${pollId}:results`;

const cacheResults = async (pollId: string) => {
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

  if (!poll) return null;

  await redis.set(getCacheKey(pollId), JSON.stringify(poll), 'EX', CACHE_TTL);
  return poll;
};

export const castVote = async (userId: string, pollId: string, input: CastVoteInput) => {
  // check poll exists
  // SQL: SELECT id FROM "Poll" WHERE id = $1 LIMIT 1
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: { id: true },
  });

  if (!poll) throw new AppError('Poll not found', 404, 'POLL_NOT_FOUND');

  // check option belongs to poll
  // SQL: SELECT id FROM "Option" WHERE id = $1 AND "pollId" = $2 LIMIT 1
  const option = await prisma.option.findFirst({
    where: {
      id: input.optionId,
      pollId,
    },
    select: { id: true },
  });

  if (!option) throw new AppError('Invalid option for this poll', 400, 'INVALID_OPTION');

  // upsert vote — insert if first vote, update optionId if changing vote
  // SQL: INSERT INTO "Vote" (id, "userId", "pollId", "optionId", "createdAt", "updatedAt")
  //      VALUES (gen_random_uuid(), $1, $2, $3, now(), now())
  //      ON CONFLICT ("userId", "pollId")
  //      DO UPDATE SET "optionId" = $3, "updatedAt" = now()
  //      RETURNING *
  const vote = await prisma.vote.upsert({
    where: {
      userId_pollId: { userId, pollId },
    },
    create: {
      userId,
      pollId,
      optionId: input.optionId,
    },
    update: {
      optionId: input.optionId,
    },
  });

  // invalidate cache — next GET will recompute
  await redis.del(getCacheKey(pollId));

  return vote;
};

export const getPollResults = async (pollId: string) => {
  const cacheKey = getCacheKey(pollId);

  // check cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return { ...JSON.parse(cached), fromCache: true };
  }

  // cache miss — compute from DB and cache it
  const poll = await cacheResults(pollId);
  if (!poll) throw new AppError('Poll not found', 404, 'POLL_NOT_FOUND');

  return { ...poll, fromCache: false };
};

/*
    📌 Three things worth noting. 
    First, the upsert SQL comment — ON CONFLICT ("userId", "pollId") DO UPDATE is how Postgres handles "insert or update in one shot".
    This works because of the @@unique([userId, pollId]) constraint we put on the Vote model in the schema.
    The DB enforces uniqueness and the upsert exploits it elegantly.
    Second, fromCache flag on the response — this is just for our learning purposes so we can see in Postman whether Redis is actually being hit.
    Third, we always delete the cache on vote and let the next read recompute it — this is the cache-aside pattern, 
    simpler and safer than trying to update the cache in place.
*/