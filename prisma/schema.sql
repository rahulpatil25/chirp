-- Generated from prisma/schema.prisma with:
--   npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script
--
-- The Prisma CLI cannot push to a libsql:// URL, so apply this to a hosted Turso
-- database directly:
--   turso db shell <your-db> < prisma/schema.sql
-- Local development does not need this file; `npm run db:push` handles the file: database.

-- CreateTable
CREATE TABLE "Post" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");
