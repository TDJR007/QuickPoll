// backend/src/services/auth.service.ts

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma/client';
import { AppError } from '../utils/AppError';
import { env } from '../utils/env';
import { RegisterInput, LoginInput } from '../validators/auth.validator';

export const registerUser = async (input: RegisterInput) => {
  // SQL: SELECT * FROM "User" WHERE email = $1 LIMIT 1
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new AppError('Email already in use', 409, 'EMAIL_TAKEN'); // 409 = HTTP Conflict
  }

  const hashed = await bcrypt.hash(input.password, 12);
  // const hash = await bcrypt.hash(password, saltRounds).

  /* 
   Salt rounds: An integer that dictates the number of iterations of the hashing process, 
   making the computation slow to deter brute-force attacks
  */

  // SQL: INSERT INTO "User" (id, email, password, "createdAt")
  //      VALUES (gen_random_uuid(), $1, $2, now())
  //      RETURNING *
  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashed,
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });

  const token = jwt.sign(
    { userId: user.id },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user };
};

export const loginUser = async (input: LoginInput) => {
  // SQL: SELECT * FROM "User" WHERE email = $1 LIMIT 1
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(input.password, user.password);

  if (!valid) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    // Nice try buddy, not getting in today
  }

  const token = jwt.sign(
    { userId: user.id },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
  };
};

/*
    📌 Best Practices: Three things here.
    First, select on the create call — we explicitly exclude password from what gets returned, never send hashed passwords to the client even accidentally.
    Second, both wrong email and wrong password return the exact same error 'Invalid credentials' — this is intentional, you don't want to tell an attacker which one was wrong.
    Third, bcrypt salt rounds of 12 — higher is slower to crack but also slower to hash.
    It's not about the dog in the fight, it's about the fight in the ~dog~ hash.
    10-12 is the common for production. 
*/

/* Notes on SQL:

1. Why "createdAt" in quotes?
    Postgres is case-insensitive by default and lowercases everything. 
    So a column named createdAt gets stored as createdat unless you quote it. 
    Prisma creates columns with camelCase names and wraps them in double quotes to preserve the casing. So in raw SQL you'd always need "createdAt", "userId" etc.
    Plain lowercase names like id and email don't need quotes because there's no casing to preserve.

2. What is $1, $2?
    These are parameterized query placeholders. Instead of writing:
    WHERE email = 'user@example.com'
    Postgres uses:
    WHERE email = $1
    And passes the actual value separately. This is how every serious DB driver works and it's critical for security — it's what prevents SQL injection. If someone passes '; DROP TABLE "User"; -- as their email, with parameterized queries Postgres treats it as a literal string value, not executable SQL. Without them, it would run it.
    $1 = first parameter, $2 = second parameter, and so on in order.
    Prisma always uses parameterized queries under the hood — you never have to think about it, but now you know why that prisma:query log you saw earlier was full of $1, $2 

    -- This is what ORM Actually does.

    Example: Create User 

    -- Step 1: Define the Prepared Statement
    PREPARE USRCREATEPLAN (text, text) AS
    INSERT INTO "User" (id, email, password, "createdAt")
    VALUES (
    gen_random_uuid(),
    $1,
    $2,
    now()
    )
    RETURNING id, email, "createdAt";

    -- Step 2: Execute the prepared statement with values

    EXECUTE USRCREATEPLAN ('dummy@example.com', '$2a$12$placeholderhashfortesting123')

    -- Verify (just for us): 
    select * from "User" u
    where u.email ilike 'dummy@example.com'

    -- Step 3: Deallocate the Statement
    DEALLOCATE USRCREATEPLAN
*/