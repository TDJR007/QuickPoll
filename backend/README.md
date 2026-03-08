# QuickPoll — Backend

A production-minded full-stack voting app built for learning. Single question polls, JWT auth via httpOnly cookies, Redis caching, and clean layered architecture.

## Tech Stack

- **Runtime:** Node.js + Express + TypeScript
- **Database:** PostgreSQL (via Prisma ORM)
- **Cache:** Redis (ioredis)
- **Auth:** JWT in httpOnly cookies
- **Validation:** Zod
- **Logging:** Pino + Pino Pretty (dev)

## Prerequisites

- Node.js 18+
- Docker + Docker Compose

## Getting Started

**1. Clone and install**
```bash
cd backend
npm install
```

**2. Set up environment**
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
PORT=3000
DATABASE_URL="postgresql://quickpoll:quickpoll@localhost:5432/quickpoll"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="change_this_in_production"
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**3. Start Docker services**
```bash
# from project root
docker compose up -d
```

This starts:
- PostgreSQL on port `5432`
- Redis on port `6379`
- pgAdmin on port `8080` (admin@quickpoll.com / admin)

**4. Run migrations**
```bash
npx prisma migrate dev
```

**5. Start the dev server**
```bash
npm run dev
```

Server runs on `http://localhost:3000`.

## API Routes

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login, sets httpOnly cookie |
| POST | `/auth/logout` | ❌ | Clears auth cookie |

### Polls
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/polls` | ✅ | Create a poll |
| GET | `/polls/:id` | ❌ | Get poll by ID |
| GET | `/polls/:id/results` | ❌ | Get poll results (Redis cached) |
| POST | `/polls/:id/vote` | ✅ | Cast or change a vote |

### Health
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Server health check |

## Project Structure

```
src/
  routes/         # Express routers
  controllers/    # Request/response handlers
  services/       # Business logic
  middleware/     # Auth, logging, error handling
  validators/     # Zod schemas
  utils/          # Logger, Redis client, env, AppError
prisma/
  schema.prisma   # DB schema
  client.ts       # Prisma singleton
  migrations/     # Migration history
```

## Architecture

```
Request → requestLogger middleware
       → Route
       → authenticate middleware (protected routes)
       → Controller (parse + validate)
       → Service (business logic + DB/Redis)
       → Response

Error anywhere → errorHandler middleware
              → logs to console (pino)
              → attempts DB log (errors only)
              → returns { error, requestId }
```

## Key Design Decisions

- **httpOnly cookies** for JWT — JS can't read it, safer than localStorage
- **Redis cache-aside pattern** — results cached for 5 min, invalidated on vote
- **Zod env validation** — app refuses to start if env vars are missing or malformed
- **Single PrismaClient instance** — prevents connection pool exhaustion
- **Custom AppError class** — distinguishes known errors from unexpected ones
- **requestId on every request** — UUIDs for tracing errors across logs

## Scripts

```bash
npm run dev        # Start with nodemon (hot reload)
npm run build      # Compile TypeScript
npm run start      # Run compiled JS
npx prisma studio  # Visual DB browser
```

## Production

Build the frontend first:
```bash
cd ../frontend && npm run build
```

Then set `NODE_ENV=production` in `.env` and run:
```bash
npm run build && npm run start
```

The backend serves the frontend static files from `frontend/dist/` in production.