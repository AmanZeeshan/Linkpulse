import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validate } from "../middleware/validate.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { createApiKeySchema } from "../lib/schemas.js";
import * as apiKeyService from "../services/apiKeyService.js";

export const keysRouter = Router();

keysRouter.use(requireAuth());

keysRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const keys = await apiKeyService.listApiKeys((req as AuthedRequest).auth.userId);
    res.json({ keys });
  }),
);

keysRouter.post(
  "/",
  validate(createApiKeySchema),
  asyncHandler(async (req, res) => {
    const body = (req as typeof req & { validated: z.infer<typeof createApiKeySchema> }).validated;
    const key = await apiKeyService.createApiKey((req as AuthedRequest).auth.userId, body.name);
    res.status(201).json({ key });
  }),
);

keysRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await apiKeyService.revokeApiKey((req as AuthedRequest).auth.userId, req.params.id);
    res.json({ ok: true });
  }),
);
