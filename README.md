# QuickPoll

A tiny but production-minded full-stack polling app. Create a poll, share the link, vote, see live results.

## Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma |
| Cache | Redis |
| Auth | JWT in httpOnly cookies |
| Frontend | React + TypeScript + Vite |
| UI | shadcn/ui + Tailwind |
| State | Zustand + TanStack Query |

## Features

- Register and login
- Create a poll with multiple options
- Share poll via link
- Vote once per poll, change your vote anytime
- Live results with animated progress bars
- Redis cached results
- Dark mode

## Getting Started

```bash
# 1. Start Docker services (Postgres + Redis + pgAdmin)
docker compose up -d

# 2. Backend
cd backend && npm install
cp .env.example .env   # fill in values
npx prisma migrate dev
npm run dev            # http://localhost:3000

# 3. Frontend
cd frontend && npm install
cp .env.example .env   # fill in values
npm run dev            # http://localhost:5173
```

## Docs

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [Redis Notes](notes/REDIS-NOTES.md)

## License

MIT