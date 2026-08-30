import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors.js";
import { config } from "../config.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    if (err.status === 429 && err.details && typeof err.details === "object" && "retryAfterSec" in err.details) {
      res.setHeader("Retry-After", String((err.details as { retryAfterSec: number }).retryAfterSec));
    }
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? undefined,
      },
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: {
      code: "INTERNAL",
      message: config.isProd ? "Internal server error" : err instanceof Error ? err.message : "Unknown error",
    },
  });
}

export function asyncHandler<T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: T, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
}
