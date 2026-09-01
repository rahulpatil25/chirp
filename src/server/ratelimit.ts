import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { env } from "~/env.mjs";

const REQUESTS = 3;
const WINDOW_MS = 60_000;

export type RatelimitResult = { success: boolean };

/**
 * A sliding-window limiter kept in process memory. State is per-instance and is lost on restart,
 * so it is only meant for local development and tests. Configure Upstash for anything deployed.
 */
const createInMemoryRatelimiter = () => {
  const hits = new Map<string, number[]>();

  return {
    limit: (identifier: string): RatelimitResult => {
      const now = Date.now();
      const windowStart = now - WINDOW_MS;
      const recent = (hits.get(identifier) ?? []).filter(
        (timestamp) => timestamp > windowStart,
      );

      if (recent.length >= REQUESTS) {
        hits.set(identifier, recent);
        return { success: false };
      }

      recent.push(now);
      hits.set(identifier, recent);

      // Drop identifiers that have aged out so the map doesn't grow without bound.
      for (const [key, timestamps] of hits) {
        if (timestamps.every((timestamp) => timestamp <= windowStart)) {
          hits.delete(key);
        }
      }

      return { success: true };
    },
  };
};

const createUpstashRatelimiter = (url: string, token: string) => {
  const ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(REQUESTS, "1 m"),
    analytics: true,
    prefix: "@upstash/ratelimit",
  });

  return {
    limit: async (identifier: string): Promise<RatelimitResult> => {
      const { success } = await ratelimit.limit(identifier);
      return { success };
    },
  };
};

/**
 * Built lazily so that a missing Upstash configuration surfaces as a degraded limiter at request
 * time rather than an exception while the module graph is still being imported.
 */
let ratelimiter:
  | { limit: (id: string) => RatelimitResult | Promise<RatelimitResult> }
  | undefined;

export const getRatelimiter = () => {
  if (ratelimiter) return ratelimiter;

  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    ratelimiter = createUpstashRatelimiter(url, token);
  } else {
    if (env.NODE_ENV === "production") {
      console.warn(
        "[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN are not set. Falling back to an in-memory " +
          "limiter, which does not share state between instances.",
      );
    }
    ratelimiter = createInMemoryRatelimiter();
  }

  return ratelimiter;
};
