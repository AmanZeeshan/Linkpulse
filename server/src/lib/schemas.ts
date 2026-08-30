import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const loginSchema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  password: z.string().min(1),
});

const urlSchema = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((value) => {
    try {
      const u = new URL(value);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, "URL must use http or https");

export const createLinkSchema = z.object({
  originalUrl: urlSchema,
  slug: z.string().trim().min(3).max(32).optional(),
  title: z.string().trim().max(120).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const updateLinkSchema = z.object({
  originalUrl: urlSchema.optional(),
  slug: z.string().trim().min(3).max(32).optional(),
  title: z.string().trim().max(120).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const createApiKeySchema = z.object({
  name: z.string().trim().min(2).max(60),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional().default(""),
  status: z.enum(["all", "active", "expired", "disabled"]).optional().default("all"),
});

export const rangeQuerySchema = z.object({
  range: z.enum(["24h", "7d", "30d", "90d", "all"]).optional().default("7d"),
});
