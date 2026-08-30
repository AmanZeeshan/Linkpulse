import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validate } from "../middleware/validate.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { rangeQuerySchema } from "../lib/schemas.js";
import * as analyticsService from "../services/analyticsService.js";

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth());

analyticsRouter.get(
  "/overview",
  validate(rangeQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const query = (req as typeof req & { validated: z.infer<typeof rangeQuerySchema> }).validated;
    const data = await analyticsService.overview((req as AuthedRequest).auth.userId, query.range);
    res.json(data);
  }),
);
