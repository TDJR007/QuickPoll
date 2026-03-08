# Redis in QuickPoll

## What We Use Redis For

One thing only: **caching poll results**.

Every time someone requests poll results, instead of hitting Postgres and running a JOIN across Poll, Option, and Vote tables, we check Redis first. If the data is there, we return it instantly. If not, we compute it from the DB and store it for next time.

That's it. No queues, no pub/sub, no rate limiting. Cache only.

---

## The Cache-Aside Pattern

This is the pattern we implement. It's the most common caching pattern in production.

```
GET /polls/:id/results

1. Check Redis for key poll:{id}:results
2. Cache HIT  → return cached data (fromCache: true)
3. Cache MISS → query Postgres
             → store result in Redis with 5 min TTL
             → return fresh data (fromCache: false)

POST /polls/:id/vote

1. Upsert vote in Postgres
2. DELETE cache key poll:{id}:results
3. Next GET recomputes from DB and re-caches
```

"Cache-aside" means the application manages the cache explicitly — it's not automatic. The app decides when to read from cache, when to write to cache, and when to invalidate it.

---

## Key Structure

```
poll:{pollId}:results
```

Example:
```
poll:5c85d60b-fe73-45f1-84b7-2e108cc4ae59:results
```

Namespacing with colons (`poll:`, `:results`) is a Redis convention. It keeps keys organised and readable in tools like RedisInsight. Think of it like a folder structure.

---

## TTL (Time To Live)

We set a TTL of **5 minutes** on every cached result.

```typescript
await redis.set(key, JSON.stringify(data), 'EX', 300);
```

`EX 300` means the key expires automatically after 300 seconds. Even if a vote somehow slips through without invalidating the cache, the data is at most 5 minutes stale. TTL is your safety net.

---

## Cache Invalidation

When a vote is cast we delete the cache key immediately:

```typescript
await redis.del(getCacheKey(pollId));
```

The next request recomputes from the DB and re-caches. This is called **delete-on-write** — simpler and safer than trying to update the cached value in place, which can cause race conditions.

---

## What We Store

We store the full poll object including options and vote counts as JSON:

```json
{
  "id": "uuid",
  "question": "What is the best language?",
  "options": [
    { "id": "uuid", "text": "TypeScript", "_count": { "votes": 42 } },
    { "id": "uuid", "text": "Python", "_count": { "votes": 17 } }
  ]
}
```

Serialized with `JSON.stringify`, deserialized with `JSON.parse`. Redis only stores strings — always serialize objects before storing.

---

## The `fromCache` Flag

We add a `fromCache: boolean` field to every results response:

```typescript
return { ...poll, fromCache: true };  // cache hit
return { ...poll, fromCache: false }; // cache miss
```

This is for observability — you can see in Postman or the browser whether Redis is being hit. In a real system you'd track this as a metric (cache hit rate). A low hit rate means your TTL is too short or invalidation is too aggressive.

---

## Redis vs Postgres — When to Use Which

| Question | Answer |
|----------|--------|
| Source of truth for data? | Always Postgres |
| Frequently read, rarely written? | Cache in Redis |
| Needs to survive a restart? | Postgres (Redis is volatile by default) |
| Sub-millisecond reads needed? | Redis |
| Complex queries or joins? | Postgres, then optionally cache the result |

Redis is fast because it lives entirely in memory. Postgres is durable because it writes to disk. They complement each other — Postgres owns the data, Redis makes reading it fast.

---

## Useful Redis CLI Commands

```bash
# Connect to Redis in Docker
docker exec -it quickpoll_redis redis-cli

# See all poll result keys
KEYS poll:*

# Inspect a cached result
GET poll:5c85d60b-fe73-45f1-84b7-2e108cc4ae59:results

# Check TTL remaining on a key (seconds)
TTL poll:5c85d60b-fe73-45f1-84b7-2e108cc4ae59:results

# Manually delete a key (force cache miss)
DEL poll:5c85d60b-fe73-45f1-84b7-2e108cc4ae59:results

# Flush everything (nuclear option)
FLUSHALL
```

---

## What We Deliberately Did NOT Use Redis For

- **Rate limiting** — out of scope for this project
- **Session storage** — we use httpOnly cookies + JWT instead
- **Pub/sub for real-time** — we use polling (refetchInterval) instead
- **Job queues** — no background jobs in this app

Each of these is a legitimate Redis use case you'd reach for as the app grows.