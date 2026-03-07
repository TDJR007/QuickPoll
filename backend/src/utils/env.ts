// src/utils/env.ts

import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  REDIS_URL: z.string(),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  FRONTEND_URL: z.string().url('Invalid frontend URL'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    
  const flatErrors = z.flattenError(parsed.error);

  console.error('Invalid environment variables:');
  console.error('Form errors (top-level):', flatErrors.formErrors);
  console.error('Field errors:', flatErrors.fieldErrors);

  // Optional: throw a nicer aggregated error
  const messages = [
    ...flatErrors.formErrors,
    ...Object.entries(flatErrors.fieldErrors).flatMap(([key, errs]) =>
      errs.map(e => `${key}: ${e}`)
    ),
  ];

  console.error(messages.join('\n'));
  process.exit(1);
}

export const env = parsed.data;

/* 
    📌 Best practice here: we validate env variables at startup with Zod. 
    If something is missing the app refuses to start and tells you exactly what's wrong.
    No more mysterious undefined errors at runtime because someone forgot to set JWT_SECRET.
    This is a pattern worth stealing for every project.
*/