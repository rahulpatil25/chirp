import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Next.js 16 renamed the `middleware` file convention to `proxy`.
 *
 * `clerkMiddleware` attaches the auth state to every request but does not gate anything on its
 * own. Chirp is a public timeline — reading posts and profiles needs no account — so authorization
 * lives where it is actually enforced: `privateProcedure` in `src/server/api/trpc.ts`.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
  ],
};
