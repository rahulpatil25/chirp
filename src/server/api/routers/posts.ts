import { clerkClient } from "@clerk/nextjs/server";
import { type Post } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";
import { getRatelimiter } from "~/server/ratelimit";

const addUserDataToPosts = async (posts: Post[]) => {
  // An empty `userId` filter would ask Clerk for an arbitrary page of users, so skip the call.
  if (posts.length === 0) return [];

  const client = await clerkClient();
  const { data } = await client.users.getUserList({
    userId: posts.map((post) => post.authorId),
    limit: 100,
  });
  const users = data.map(filterUserForClient);

  return posts.map((post) => {
    const author = users.find((user) => user.id === post.authorId);

    if (!author?.username)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Author for post not found",
      });

    return {
      post,
      author: {
        ...author,
        username: author.username,
      },
    };
  });
};

export const postsRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const id = Number.parseInt(input.id, 10);

      if (Number.isNaN(id)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid post id",
        });
      }

      const post = await ctx.db.post.findUnique({ where: { id } });

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [postWithAuthor] = await addUserDataToPosts([post]);

      if (!postWithAuthor) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return postWithAuthor;
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.post.findMany({
      take: 100,
      orderBy: [{ createdAt: "desc" }],
    });

    return addUserDataToPosts(posts);
  }),

  getPostsByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.db.post
        .findMany({
          where: { authorId: input.userId },
          take: 100,
          orderBy: [{ createdAt: "desc" }],
        })
        .then(addUserDataToPosts),
    ),

  create: privateProcedure
    .input(
      z.object({
        content: z.emoji("Only emojis are allowed").min(1).max(280),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;

      const { success } = await getRatelimiter().limit(authorId);

      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }

      return ctx.db.post.create({
        data: {
          authorId,
          content: input.content,
        },
      });
    }),
});
