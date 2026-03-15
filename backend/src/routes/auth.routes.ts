// backend/src/routes/auth.routes.ts

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { register, login, logout, me } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, me);

export default router;

/*
    📌 Inside index.ts -> app.use('/auth', authRoutes) is route prefixing — every route inside auth.routes.ts automatically gets /auth prepended. 
    So router.post('/register') becomes POST /auth/register. 
    Keeps index.ts clean as we add more route files.
*/