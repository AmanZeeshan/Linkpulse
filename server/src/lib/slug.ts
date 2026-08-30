import { customAlphabet } from "nanoid";
import { Errors } from "./errors.js";

const alphabet = "23456789abcdefghijkmnpqrstuvwxyz";
const generate = customAlphabet(alphabet, 7);

export const RESERVED_SLUGS = new Set([
  "api",
  "app",
  "admin",
  "login",
  "register",
  "dashboard",
  "links",
  "keys",
  "health",
  "static",
  "assets",
  "qr",
  "auth",
  "analytics",
  "favicon.ico",
  "robots.txt",
]);

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/i;

export function generateSlug(): string {
  return generate();
}

export function normalizeSlug(raw: string): string {
  const slug = raw.trim().toLowerCase();
  if (slug.length < 3 || slug.length > 32 || !SLUG_RE.test(slug)) {
    throw Errors.validation(
      "Slug must be 3–32 characters, alphanumeric, and may include hyphens (not at the ends)",
    );
  }
  if (RESERVED_SLUGS.has(slug)) {
    throw Errors.conflict("SLUG_RESERVED", "That slug is reserved");
  }
  return slug;
}
