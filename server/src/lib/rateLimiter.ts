import { Errors } from "./errors.js";

type Bucket = { timestamps: number[] };

export class SlidingWindowLimiter {
  private buckets = new Map<string, Bucket>();
  private lastSweep = Date.now();

  constructor(private readonly maxEntries = 50_000) {}

  consume(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    this.sweep(now, windowMs);

    const bucket = this.buckets.get(key) ?? { timestamps: [] };
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

    if (bucket.timestamps.length >= limit) {
      const oldest = bucket.timestamps[0] ?? now;
      const retryAfterMs = windowMs - (now - oldest);
      this.buckets.set(key, bucket);
      return {
        allowed: false,
        remaining: 0,
        limit,
        reset: now + retryAfterMs,
        retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      };
    }

    bucket.timestamps.push(now);
    this.buckets.set(key, bucket);

    return {
      allowed: true,
      remaining: Math.max(0, limit - bucket.timestamps.length),
      limit,
      reset: now + windowMs,
      retryAfterSec: 0,
    };
  }

  private sweep(now: number, windowMs: number) {
    if (now - this.lastSweep < 30_000 && this.buckets.size < this.maxEntries) return;
    this.lastSweep = now;
    for (const [key, bucket] of this.buckets) {
      bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
      if (bucket.timestamps.length === 0) this.buckets.delete(key);
    }
  }
}

export const limiter = new SlidingWindowLimiter();

export function assertRateLimit(key: string, limit: number, windowMs: number) {
  const result = limiter.consume(key, limit, windowMs);
  if (!result.allowed) {
    throw Errors.rateLimited(result.retryAfterSec);
  }
  return result;
}
