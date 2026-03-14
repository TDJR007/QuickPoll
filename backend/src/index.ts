import express from 'express';
import path from 'path';
import { env } from './utils/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import pollRoutes from './routes/poll.routes';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { globalLimiter, authLimiter, pollLimiter } from './middleware/rateLimiter';
import { prisma } from './utils/prisma';
import { logger } from './utils/logger';
import redis from './utils/redis';

const app = express();

const FRONTEND_DIST = path.resolve(__dirname, '../../frontend/dist');

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(globalLimiter);
app.use(express.json());
app.use(requestLogger);

app.use('/auth', authLimiter, authRoutes);
app.use('/polls', pollRoutes);

// Serve frontend static files
if (env.NODE_ENV === 'production') {
  app.use(express.static(FRONTEND_DIST));

  // SPA fallback — any unknown route serves index.html
  app.get('/{*path}', (req, res, next) => {
    const indexPath = path.resolve(FRONTEND_DIST, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) next(err);
    });
  });
}

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});

export default app;

/*
  📌 Three things here. First, path.resolve(__dirname, '../../frontend/dist') gives an absolute path
  — Express static middleware uses this to jail file serving to that directory, so ../../ in a URL can't escape it. 
  Second, the SPA fallback app.get('*') catches any route that isn't an API route and serves index.html — this is what makes React Router work on page refresh in production,
  otherwise /poll/123 would 404 on the server.
  Third, we only do this in production — in dev, Vite serves the frontend on its own port with HMR. Note the fallback must come AFTER all API routes otherwise it'd swallow your API calls. 

  📌 This is the production-correct pattern — let Prisma manage the pool during normal operation, but listen for shutdown signals and disconnect cleanly before the process exits. 
  Render sends SIGTERM before killing your app, giving you a window to clean up.

  📌 Middleware order matters in Express — requests flow top to bottom.
  By placing /health before globalLimiter, health check requests never touch the rate limiter or Redis.
  Everything else still gets rate limited. Simple and surgical
*/