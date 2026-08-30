import type { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { Errors } from "../lib/errors.js";

export function validate(schema: ZodSchema, source: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      const details = parsed.error.flatten();
      next(Errors.validation("Request validation failed", details));
      return;
    }
    (req as Request & { validated: unknown }).validated = parsed.data;
    next();
  };
}
