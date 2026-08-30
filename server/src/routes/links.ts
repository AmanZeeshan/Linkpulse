import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validate } from "../middleware/validate.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { createLinkSchema, listQuerySchema, rangeQuerySchema, updateLinkSchema } from "../lib/schemas.js";
import * as linkService from "../services/linkService.js";
import * as analyticsService from "../services/analyticsService.js";
import { limiter } from "../lib/rateLimiter.js";
import { Errors } from "../lib/errors.js";

export const linksRouter = Router();

linksRouter.use(requireAuth());

linksRouter.get(
  "/",
  validate(listQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const query = (req as typeof req & { validated: z.infer<typeof listQuerySchema> }).validated;
    const result = await linkService.listLinks((req as AuthedRequest).auth.userId, query);
    res.json(result);
  }),
);

linksRouter.post(
  "/",
  validate(createLinkSchema),
  asyncHandler(async (req, res) => {
    const auth = (req as AuthedRequest).auth;
    const burst = limiter.consume(`create:${auth.userId}`, 60, 60 * 60 * 1000);
    if (!burst.allowed) throw Errors.rateLimited(burst.retryAfterSec);

    const body = (req as typeof req & { validated: z.infer<typeof createLinkSchema> }).validated;
    const link = await linkService.createLink(auth.userId, body);
    res.status(201).json({ link });
  }),
);

linksRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const link = await linkService.getLink((req as AuthedRequest).auth.userId, req.params.id);
    res.json({ link });
  }),
);

linksRouter.patch(
  "/:id",
  validate(updateLinkSchema),
  asyncHandler(async (req, res) => {
    const body = (req as typeof req & { validated: z.infer<typeof updateLinkSchema> }).validated;
    const link = await linkService.updateLink((req as AuthedRequest).auth.userId, req.params.id, body);
    res.json({ link });
  }),
);

linksRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await linkService.deleteLink((req as AuthedRequest).auth.userId, req.params.id);
    res.json({ ok: true });
  }),
);

linksRouter.get(
  "/:id/analytics",
  validate(rangeQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const query = (req as typeof req & { validated: z.infer<typeof rangeQuerySchema> }).validated;
    const data = await analyticsService.linkAnalytics(
      (req as AuthedRequest).auth.userId,
      req.params.id,
      query.range,
    );
    res.json(data);
  }),
);

linksRouter.get(
  "/:id/export",
  asyncHandler(async (req, res) => {
    const csv = await analyticsService.exportClicksCsv((req as AuthedRequest).auth.userId, req.params.id);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${csv.filename}"`);
    res.send(csv.body);
  }),
);
