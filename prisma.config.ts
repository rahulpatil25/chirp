import { defineConfig } from "prisma/config";

/**
 * Prisma 7 moved the connection URL out of `schema.prisma`. The CLI (`db:push`, `db:studio`)
 * reads it from here; the application passes it to a driver adapter in `src/server/db.ts`.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
});
