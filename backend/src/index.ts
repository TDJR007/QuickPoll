import express from 'express';
import { env } from './utils/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { AppError } from './utils/AppError';

const app = express();

app.use(express.json());
app.use(requestLogger);
app.use(errorHandler);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});

export default app;