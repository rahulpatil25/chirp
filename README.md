# Chirp

A tiny microblog where every post has to be emoji. Built on the
[T3 Stack](https://create.t3.gg/): Next.js, TypeScript, tRPC, Prisma, Tailwind CSS and Clerk.

## Stack

| Concern       | Choice                                                                      |
| ------------- | --------------------------------------------------------------------------- |
| Framework     | [Next.js 16](https://nextjs.org) (Pages Router) + React 19                  |
| API           | [tRPC 11](https://trpc.io) + [TanStack Query 5](https://tanstack.com/query) |
| Database      | [Prisma 7](https://prisma.io) — SQLite by default                           |
| Auth          | [Clerk](https://clerk.com)                                                  |
| Styling       | [Tailwind CSS 4](https://tailwindcss.com)                                   |
| Rate limiting | [Upstash Redis](https://upstash.com), optional                              |

## Getting started

You need **Node.js 20.9 or newer** and a free Clerk account. Nothing else — the database is a
local SQLite file and rate limiting falls back to an in-memory limiter when Upstash is not
configured.

```bash
git clone https://github.com/rahulpatil25/chirp.git
cd chirp
npm install
cp .env.example .env
```

Now fill in the two Clerk variables in `.env`:

1. Create an application at [dashboard.clerk.com](https://dashboard.clerk.com).
2. Under **Configure → Email, phone, username**, enable **Username**. Chirp addresses users by
   username and profile pages will not resolve for accounts without one.
3. Copy the publishable key and secret key from **API Keys** into
   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.

Then create the database and start the dev server:

```bash
npm run db:push   # creates prisma/dev.db from the schema
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Scripts

| Script                 | What it does                           |
| ---------------------- | -------------------------------------- |
| `npm run dev`          | Start the dev server                   |
| `npm run build`        | Production build                       |
| `npm start`            | Serve the production build             |
| `npm run typecheck`    | `tsc --noEmit`                         |
| `npm run lint`         | ESLint (flat config, type-aware rules) |
| `npm run lint:fix`     | ESLint with `--fix`                    |
| `npm run format`       | Format everything with Prettier        |
| `npm run format:check` | Verify formatting, as CI does          |
| `npm run db:push`      | Push the Prisma schema to the database |
| `npm run db:studio`    | Open Prisma Studio                     |

CI runs `format:check`, `typecheck`, `lint` and `build` on every pull request and on pushes to
`master`.

## Environment variables

Validated at startup by `src/env.mjs`, so a missing or malformed value fails fast with a readable
message instead of at some later request. See `.env.example` for the annotated list.

| Variable                            | Required | Notes                                         |
| ----------------------------------- | -------- | --------------------------------------------- |
| `DATABASE_URL`                      | yes      | Defaults to `file:./prisma/dev.db`            |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | yes      | From the Clerk dashboard                      |
| `CLERK_SECRET_KEY`                  | yes      | From the Clerk dashboard                      |
| `UPSTASH_REDIS_REST_URL`            | no       | Falls back to an in-memory limiter when unset |
| `UPSTASH_REDIS_REST_TOKEN`          | no       | Required together with the URL above          |

Set `SKIP_ENV_VALIDATION=1` to bypass validation, which is useful for container builds.

## Project layout

```
prisma/schema.prisma          Data model
prisma.config.ts              Prisma CLI config (connection URL lives here in Prisma 7)
src/pages/                    Routes: feed, /@username, /post/:id
src/proxy.ts                  Clerk session middleware (Next 16 "proxy" convention)
src/server/api/routers/       tRPC routers
src/server/db.ts              Prisma client + driver adapter
src/server/ratelimit.ts       Upstash limiter with in-memory fallback
src/env.mjs                   Environment schema
```

## Deploying

The defaults are tuned for local development; two of them are worth revisiting before you deploy.

**Database.** SQLite on a serverless host resets whenever the instance does. To move to a hosted
database, change three things so they agree:

1. `provider` in `prisma/schema.prisma` (`mysql` or `postgresql`) — Prisma does not permit `env()`
   here, so it has to be a literal.
2. The driver adapter in `src/server/db.ts` (for example `@prisma/adapter-mariadb`).
3. `DATABASE_URL` in the deployment environment.

The `Post` model uses no provider-specific column types, so it ports across all three unchanged.

**Rate limiting.** The in-memory limiter keeps its counters per process, so it does not hold across
more than one instance. Set the two `UPSTASH_*` variables in any real deployment.

## Notes

- Posting is limited to 3 posts per minute per user and is enforced server-side in
  `privateProcedure`. Clerk's middleware only attaches session state; it does not gate routes, so
  reading the timeline and profiles works signed out.
- Posts must be emoji-only, capped at 280 characters, enforced by Zod on the server.
