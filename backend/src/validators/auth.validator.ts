// backend/src/validators/auth.validators.ts

import { z } from 'zod';

export const registerSchema = z.object({
  email: z.email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/*
    📌 Two things worth noting. 
    First, z.infer<typeof schema> derives a TypeScript type straight from your Zod schema — one source of truth, no duplicate type definitions.
    Second, we keep login password validation minimal on purpose — we don't want to leak information 
    about password rules to someone trying to brute force an account.
*/