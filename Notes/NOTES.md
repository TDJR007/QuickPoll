### Find which process is running on a given port

Example: `sudo lsof -i :5432`

### Fire up a docker compose:

`docker compose -f 'docker-compose.yml' up -d --build`

// Get the Docker (ms-azuretools) extension makes life a lot easier

- The build flag forces compose to rebuild images before starting containers, which is useful if you've made changes to your Dockerfiles or the application's source code since the last build, better always use it.

### Stop Docker compose

`docker compose down`

- Stops the containers and removes the containers, networks, and the default network that were created by docker compose up.

### List running containers

`docker ps`

### Stop a particular container

`docker stop <container name>`

---

## Prisma Setup

**Why Prisma (and ORM's in general):** Prisma is one of the best modern ORMs for TypeScript because it gives you full type-safety (autocompletion + compile-time checks), easy migrations, and a clean query API.

## Step 1: Install The Packages

### Prisma CLI (for init, migrate, studio, generate) → dev-dependency
`npm install prisma --save-dev`

### Prisma Client (the actual runtime library you import and query with)
`npm install @prisma/client`

## Step 2: Initialize Prisma

`npx prisma init`

This does three nice things:

- Creates a new folder ./prisma/ with schema.prisma (your single source of truth for DB models)
- Creates .env (or adds to it) with a placeholder DATABASE_URL
- Adds .env to .gitignore automatically (good practice)

## Step 3: Configure the connection (use your Docker Postgres)

Open `.env` and set:

`DATABASE_URL="postgresql://quickpoll:quickpoll@localhost:5432/quickpoll?schema=public"`

Tip: In real projects, never commit .env. Use .env.example for team members. During deployment configure environment variables at OS level (no files)

## Step 4: Define your first model in `prisma/schema.prisma`

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  // configure url ""DATABASE_URL" in prisma.config.ts
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())

  polls Poll[]
  votes Vote[]
}

model Poll {
  id        String   @id @default(uuid())
  userId    String
  question  String
  createdAt DateTime @default(now())

  user    User     @default(dbgenerated())  
  options Option[]
  votes   Vote[]

  @@index([userId])
}

model Option {
  id        String   @id @default(uuid())
  pollId    String
  text      String
  createdAt DateTime @default(now())

  poll  Poll   @relation(fields: [pollId], references: [id], onDelete: Cascade)
  votes Vote[]

  @@index([pollId])
}

model Vote {
  id        String   @id @default(uuid())
  userId    String
  pollId    String
  optionId  String
  createdAt DateTime @default(now())

  user   User   @relation(fields: [userId], references: [id])
  poll   Poll   @relation(fields: [pollId], references: [id], onDelete: Cascade)
  option Option @relation(fields: [optionId], references: [id])

  @@unique([userId, pollId])
  @@index([pollId])
}

model Log {
  id        String   @id @default(uuid())
  requestId String
  level     String
  message   String
  metadata  Json?
  createdAt DateTime @default(now())
}
```

📌 A few things to notice:

- onDelete: Cascade on options and votes means if a poll is deleted, everything under it cleans up automatically
- @@unique([userId, pollId]) on Vote is what enforces one vote per user per poll at the DB level — not just app logic
- onDelete: Cascade → if poll deleted → delete its options too
- @@index on foreign keys speeds up lookups
- user User @relation(fields: [userId], references: [id]): This is the relation field that connects the Poll model to the User model via foreign key

## Step 5: Generate Prisma Client & create the DB tables

1. Generate the TypeScript client (creates types + query methods)
`npx prisma generate`

2. Create + apply migration (creates tables if DB is empty)
`npx prisma migrate dev --name init`

First time: it will ask for a migration name (e.g. "init")
Prisma creates a `./prisma/migrations/` folder with SQL + metadata
It applies the migration to your Postgres DB (tables created!)

If you get connection errors → double-check Postgres is running (docker compose ps) and `.env` is correct.

## Step 6: Use Prisma in your Express code

Best practice in 2025/2026: singleton instance of PrismaClient (avoid creating new connection per request — it's expensive).
Create a new file: src/lib/prisma.ts (or src/db.ts)

```typescript
TypeScriptimport { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'], // optional: see SQL in dev
  });
```

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
Why singleton?

- In development (hot reload), multiple instances leak connections
- In production, one shared client reuses connections

Now use it anywhere.

## Step 7:

Verify it worked:
`npx prisma studio`

This opens a browser UI at http://localhost:51212 where you can see all your empty tables sitting there ready to go.

📌 Quick lesson: migrate dev is for development only. It creates a migration file in prisma/migrations/ that tracks every schema change like a git history for your DB. In production you'd run prisma migrate deploy instead which only runs pending migrations without creating new ones.

## PgAdmin Guide:

Step-by-Step Guide

1. Open pgAdmin 4 on your computer. When you first launch it, you may be prompted to set a master password to secure saved credentials.
2. Right-click on the "Servers" node in the left-hand "Browser" panel.
3. Select Create > Server... from the context menu. This will open the Create - Server dialog.
4. In the General tab, enter a descriptive Name for your connection (e.g., "Local Development DB" or "AWS Analytics DB"). This name is for your reference within pgAdmin.
4. Go to the Connection tab.
5. Fill in the required fields with your database's connection details:
    - **Host name/address**: Enter the host name or IP address. For us `postgres`
    - **Port**: Enter the port number (default is 5432).
    - **Maintenance database**: Enter the initial database name (default is postgres). In this case `quickpoll`
    - **Username**: Enter your database username, here `quickpoll`.
    - **Password**: Enter the password for the username, here `quickpoll`.
    - (Optional, for cloud/remote databases) Go to the SSL tab and configure the SSL mode to match your provider's requirements, often Require. If a CA certificate file is needed, you can upload it here.

6. Click Save. 

7. pgAdmin will attempt to connect to the database with the provided information. If successful, the new server will appear in your "Servers" list, and you can expand it to explore schemas, tables, and run SQL queries using the Query Tool. 

