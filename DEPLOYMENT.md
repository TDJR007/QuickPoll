# QuickPoll Deployment Guide

Deploying QuickPoll to production using:
- **Neon** — managed Postgres
- **Upstash** — managed Redis
- **Render** — Node.js hosting

This guide assumes you have the code on GitHub.

---

## Step 1 — Neon (Postgres)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Click **New Project**
   - Name: `QuickPoll`
   - Postgres version: `17`
   - Cloud provider: `AWS`
   - Region: pick closest to your users (e.g. `ap-southeast-1` for Singapore)
   - Neon Auth: **No**
3. Once created, go to your project **Dashboard**
4. Find your connection string — it looks like:
   ```
   postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
5. You need **two** URLs — Neon gives you one but you derive the second:
   - **Direct URL** (from dashboard, no `-pooler`):
     ```
     postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
     ```
   - **Pooled URL** (add `-pooler` to the hostname):
     ```
     postgresql://user:pass@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
     ```
6. Save both — you'll need them for environment variables

### Run migrations against Neon

Add both URLs to `backend/.env`:
```env
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler...?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-xxx...?sslmode=require"
```

Then run:
```bash
cd backend && npx prisma migrate deploy
```

You should see your tables appear in the Neon dashboard under **Tables**.

> `migrate deploy` runs existing migrations against the DB. Never run `migrate dev` against production.

---

## Step 2 — Upstash (Redis)

1. Go to [upstash.com](https://upstash.com) and create a free account
2. Click **Create Database**
   - Name: `quickpoll`
   - Type: `Regional`
   - Region: same as Neon (e.g. `ap-southeast-1`)
   - **Enable eviction**: ✅ YES — this lets Redis evict old cache entries when memory is full instead of rejecting writes
3. Once created, go to **Details**
4. Copy the **Redis URL** — it looks like:
   ```
   rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT:YOUR_PORT
   ```
   Note the `rediss://` (double s) — this means TLS, required by Upstash
5. Save this URL — you'll need it for environment variables

---

## Step 3 — Render (Node.js hosting)

### Prerequisites
- Frontend must be built as part of the backend build command
- Backend serves frontend static files in production mode
- All environment variables must be set before first deploy

### Create the web service

1. Go to [render.com](https://render.com) and create a free account
2. Click **New → Web Service**
3. Connect your GitHub repository
4. Select your deployment branch (e.g. `deploy-neon-upstash-render` or `main`)
5. Configure the service:

| Field | Value |
|-------|-------|
| Name | `quickpoll` |
| Region | Singapore (or closest to your users) |
| Root Directory | `backend` |
| Runtime | `Node` |
| Build Command | `cd ../frontend && npm install && npm run build && cd ../backend && npm install && npm run build` |
| Start Command | `npm run start` |

### Set environment variables

Click **Environment** and add each variable:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Neon pooled connection string |
| `DIRECT_URL` | Your Neon direct connection string |
| `REDIS_URL` | Your Upstash `rediss://` URL |
| `JWT_SECRET` | A long random string (see below) |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://your-app-name.onrender.com` |
| `PORT` | `3000` |

**Generate a secure JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and use it as your `JWT_SECRET`.

6. Click **Create Web Service**
7. Watch the build logs — first build takes 3-5 minutes

### What a successful build looks like
```
==> Running build command...
✔ Generated Prisma Client
✔ Frontend built successfully
✔ TypeScript compiled
==> Your service is live 🎉
```

---

## Step 4 — Verify deployment

Once live, test the full flow:

1. Visit `https://your-app-name.onrender.com`
2. Register a new account
3. Create a poll
4. Vote on it
5. Check results show `(cached)` on second load
6. Copy the poll link and open in incognito — results visible without login

Check your services:
- **Neon dashboard** → Tables → should see User, Poll, Option, Vote rows
- **Upstash dashboard** → Data Browser → should see `poll:*` cache keys

---

## Common issues and fixes

### Build fails with `Cannot find module '@prisma/client'`
Make sure `prisma generate` runs before `tsc` in your build script:
```json
"build": "npx prisma generate && tsc"
```

### Build fails with type errors on `@types/*`
All `@types/*` packages, `typescript`, `ts-node`, and `prisma` must be in `dependencies` (not `devDependencies`) — Render only installs `dependencies` during build.

### Rate limiting blocks everyone
Add this right after `const app = express()` in `index.ts`:
```typescript
app.set('trust proxy', 1);
```
Without this, Render's load balancer IP is used for all requests — everyone shares one rate limit bucket.

### Health check eating Redis quota
Make sure `/health` route is registered **before** any rate limiting middleware:
```typescript
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use(globalLimiter); // after health check
```

### Frontend shows blank page or 500
Make sure `NODE_ENV=production` is set in Render environment variables — the backend only serves frontend static files in production mode.

### CORS errors in production
Since frontend and backend are on the same domain in production, set `VITE_API_BASE_URL` to empty string in frontend — axios will use relative URLs automatically:
```env
VITE_API_BASE_URL=
```

---

## Redeploying

Every push to your connected branch triggers an automatic redeploy on Render.

To manually redeploy:
1. Go to Render dashboard
2. Click your service
3. Click **Manual Deploy → Deploy latest commit**

---

## Free tier limits

| Service | Free tier limit |
|---------|----------------|
| Neon | 0.5 GB storage, 190 compute hours/month |
| Upstash | 500MB storage, 10,000 commands/day |
| Render | 750 hours/month, spins down after 15min inactivity |

> ⚠️ Render free tier spins down after 15 minutes of inactivity. First request after spindown takes ~30 seconds to cold start. This is normal on free tier.
