import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let limiter = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "1 d"),
    prefix: "aistudio",
    analytics: false,
  });
}

export async function checkRateLimit(ip) {
  if (!limiter) return { ok: true, remaining: null, configured: false };

  const { success, remaining } = await limiter.limit(ip || "anonymous");
  return { ok: success, remaining, configured: true };
}
