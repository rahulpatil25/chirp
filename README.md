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

| Variable                            | Required | Notes                                                      |
| ----------------------------------- | -------- | ---------------------------------------------------------- |
| `DATABASE_URL`                      | yes      | `file:./prisma/dev.db` locally, `libsql://…` in production |
| `TURSO_AUTH_TOKEN`                  | no       | Required only for a hosted Turso database                  |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | yes      | From the Clerk dashboard                                   |
| `CLERK_SECRET_KEY`                  | yes      | From the Clerk dashboard                                   |
| `UPSTASH_REDIS_REST_URL`            | no       | Falls back to an in-memory limiter when unset              |
| `UPSTASH_REDIS_REST_TOKEN`          | no       | Required together with the URL above                       |

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

Deployed on Vercel with a [Turso](https://turso.tech) database. Both have free tiers.

**1. Create the database and apply the schema.** The Prisma CLI cannot push to a `libsql://`
URL (it rejects the scheme with `P1013`), so the schema is applied directly:

```bash
turso db create chirp
turso db shell chirp < prisma/schema.sql     # regenerate with `npm run db:sql`
turso db show chirp --url                    # -> DATABASE_URL
turso db tokens create chirp                 # -> TURSO_AUTH_TOKEN
```

**2. Set the environment variables in Vercel** (Project → Settings → Environment Variables):

| Variable                            | Value                           |
| ----------------------------------- | ------------------------------- |
| `DATABASE_URL`                      | the `libsql://…` URL from above |
| `TURSO_AUTH_TOKEN`                  | the token from above            |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | from the Clerk dashboard        |
| `CLERK_SECRET_KEY`                  | from the Clerk dashboard        |
| `UPSTASH_REDIS_REST_URL`            | optional, see below             |
| `UPSTASH_REDIS_REST_TOKEN`          | optional, see below             |

**3. Import the repository on Vercel** and deploy. No build configuration is needed — the
defaults are correct for Next.js.

### Two things worth doing before sharing the link

- **Use Clerk production keys.** `pk_test_` / `sk_test_` keys belong to a Clerk _development_
  instance, which is rate-limited and renders a development banner. Create a production
  instance in the Clerk dashboard, add your Vercel domain to it, and use those keys.
- **Configure Upstash.** The in-memory rate limiter keeps counters per process, so it does not
  hold across serverless instances. Create a database at
  [console.upstash.com](https://console.upstash.com) and set both `UPSTASH_*` variables.

### Using a different database

The datasource `provider` in `prisma/schema.prisma` is `sqlite`, which is correct for both a
local file and Turso. To move to Postgres or MySQL instead, change that `provider` (Prisma does
not allow `env()` there), swap the driver adapter in `src/server/db.ts` for the matching one
(for example `@prisma/adapter-neon`), and update `DATABASE_URL`. The `Post` model uses no
provider-specific column types, so it ports unchanged.

## Notes

- Posting is limited to 3 posts per minute per user and is enforced server-side in
  `privateProcedure`. Clerk's middleware only attaches session state; it does not gate routes, so
  reading the timeline and profiles works signed out.
- Posts must be emoji-only, capped at 280 characters, enforced by Zod on the server.
