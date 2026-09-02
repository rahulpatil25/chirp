import { createNextApiHandler } from "@trpc/server/adapters/next";

import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

// export API handler
export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
  /**
   * Logged in every environment, not just development. A failing procedure in production is
   * exactly when the reason matters most, and a hosting platform's logs are the only place to
   * read it. The cause is printed separately because driver errors (Prisma in particular) often
   * carry an empty `message` and put the detail on the underlying error.
   */
  onError: ({ path, error }) => {
    const cause = error.cause;
    const detail = [
      `code=${error.code}`,
      error.message && `message=${error.message}`,
      cause && `cause=${cause.name}`,
      cause?.message && `causeMessage=${cause.message}`,
    ]
      .filter(Boolean)
      .join(" ");

    console.error(`❌ tRPC failed on ${path ?? "<no-path>"}: ${detail}`);

    if (cause?.stack) console.error(cause.stack);
  },
});
