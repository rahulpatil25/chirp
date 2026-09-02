import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    /**
     * The database connection string. Must match the datasource `provider` in
     * `prisma/schema.prisma` and the driver adapter in `src/server/db.ts`. Not validated as a URL
     * because SQLite uses relative paths (`file:./prisma/dev.db`) that URL parsers reject.
     */
    DATABASE_URL: z.string().min(1),
    /**
     * Required only for a hosted Turso database (`libsql://…`). A local `file:` database needs
     * no token, so this stays optional.
     */
    TURSO_AUTH_TOKEN: z.string().min(1).optional(),
    CLERK_SECRET_KEY: z.string().min(1),
    /**
     * Upstash is optional. When either variable is missing the app falls back to an in-memory
     * rate limiter, which is fine for local development but does not work across instances.
     */
    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Treat empty strings as undefined so a blank line in `.env` doesn't satisfy a required var.
   */
  emptyStringAsUndefined: true,
});
