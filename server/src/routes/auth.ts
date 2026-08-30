import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validate } from "../middleware/validate.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { loginSchema, registerSchema } from "../lib/schemas.js";
import * as authService from "../services/authService.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  rateLimit(8, 15 * 60 * 1000, "auth-register"),
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const body = (req as typeof req & { validated: z.infer<typeof registerSchema> }).validated;
    const result = await authService.register(body);
    res.status(201).json(result);
  }),
);

authRouter.post(
  "/login",
  rateLimit(12, 15 * 60 * 1000, "auth-login"),
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const body = (req as typeof req & { validated: z.infer<typeof loginSchema> }).validated;
    const result = await authService.login(body);
    res.json(result);
  }),
);

authRouter.get(
  "/me",
  requireAuth(),
  asyncHandler(async (req, res) => {
    const user = await authService.me((req as AuthedRequest).auth.userId);
    res.json({ user });
  }),
);
