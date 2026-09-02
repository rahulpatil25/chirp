import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

import { env } from "~/env.mjs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma 7 connects through a driver adapter rather than a `url` in the schema. libSQL covers
 * both ends with one adapter: a local `file:` database in development, and a hosted Turso
 * database (`libsql://…` plus an auth token) in production. The Prisma datasource `provider`
 * stays `sqlite` for both, so `prisma/schema.prisma` needs no environment-specific changes.
 */
const createPrismaClient = () =>
  new PrismaClient({
    adapter: new PrismaLibSql({
      url: env.DATABASE_URL,
      authToken: env.TURSO_AUTH_TOKEN,
    }),
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
