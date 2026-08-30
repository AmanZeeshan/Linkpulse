import type { NextFunction, Request, Response } from "express";
import { limiter } from "../lib/rateLimiter.js";
import { Errors } from "../lib/errors.js";
import { clientIp } from "../lib/geo.js";

export function rateLimit(limit: number, windowMs: number, prefix: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = clientIp(req);
    const result = limiter.consume(`${prefix}:${ip}`, limit, windowMs);
    res.setHeader("X-RateLimit-Limit", String(result.limit));
    res.setHeader("X-RateLimit-Remaining", String(result.remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(result.reset / 1000)));
    if (!result.allowed) {
      res.setHeader("Retry-After", String(result.retryAfterSec));
      next(Errors.rateLimited(result.retryAfterSec));
      return;
    }
    next();
  };
}
