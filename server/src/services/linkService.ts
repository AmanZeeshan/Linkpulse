import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { Errors } from "../lib/errors.js";
import { generateSlug, normalizeSlug } from "../lib/slug.js";
import { config } from "../config.js";
import { isLinkExpired, qrUrl, shortUrl } from "../lib/url.js";

export function serializeLink(link: {
  id: string;
  originalUrl: string;
  slug: string;
  title: string | null;
  expiresAt: Date | null;
  isActive: boolean;
  clickCount: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  const expired = isLinkExpired(link.expiresAt);
  return {
    ...link,
    shortUrl: shortUrl(config.publicBaseUrl, link.slug),
    qrUrl: qrUrl(config.publicBaseUrl, link.slug),
    expired,
    status: !link.isActive ? "disabled" : expired ? "expired" : "active",
  };
}

async function uniqueSlug(preferred?: string): Promise<string> {
  if (preferred) {
    const slug = normalizeSlug(preferred);
    const taken = await prisma.link.findUnique({ where: { slug } });
    if (taken) throw Errors.conflict("SLUG_TAKEN", "That custom slug is already in use");
    return slug;
  }

  for (let i = 0; i < 8; i++) {
    const slug = generateSlug();
    const taken = await prisma.link.findUnique({ where: { slug } });
    if (!taken) return slug;
  }
  throw new Error("Failed to allocate a unique slug");
}

function assertNotSelfShorten(originalUrl: string) {
  const dest = new URL(originalUrl);
  const self = new URL(config.publicBaseUrl);
  if (dest.host === self.host) {
    throw Errors.validation("Cannot shorten a Relay URL (loop prevention)");
  }
}

export async function createLink(
  userId: string,
  input: { originalUrl: string; slug?: string; title?: string | null; expiresAt?: string | null },
) {
  assertNotSelfShorten(input.originalUrl);
  const slug = await uniqueSlug(input.slug);
  const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    throw Errors.validation("Invalid expiration date");
  }

  const link = await prisma.link.create({
    data: {
      userId,
      originalUrl: input.originalUrl,
      slug,
      title: input.title || null,
      expiresAt,
    },
  });
  return serializeLink(link);
}

export async function listLinks(
  userId: string,
  query: { page: number; limit: number; q: string; status: "all" | "active" | "expired" | "disabled" },
) {
  const and: Prisma.LinkWhereInput[] = [{ userId }];

  if (query.q) {
    and.push({
      OR: [
        { slug: { contains: query.q } },
        { originalUrl: { contains: query.q } },
        { title: { contains: query.q } },
      ],
    });
  }

  if (query.status === "disabled") and.push({ isActive: false });
  if (query.status === "active") {
    and.push({
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    });
  }
  if (query.status === "expired") {
    and.push({ expiresAt: { lte: new Date() } });
  }

  const where: Prisma.LinkWhereInput = { AND: and };

  const [total, rows] = await prisma.$transaction([
    prisma.link.count({ where }),
    prisma.link.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    items: rows.map(serializeLink),
    page: query.page,
    limit: query.limit,
    total,
    pageCount: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function getLink(userId: string, id: string) {
  const link = await prisma.link.findFirst({ where: { id, userId } });
  if (!link) throw Errors.notFound("Link");
  return serializeLink(link);
}

export async function getLinkBySlug(slug: string) {
  return prisma.link.findUnique({ where: { slug } });
}

export async function updateLink(
  userId: string,
  id: string,
  input: {
    originalUrl?: string;
    slug?: string;
    title?: string | null;
    expiresAt?: string | null;
    isActive?: boolean;
  },
) {
  const existing = await prisma.link.findFirst({ where: { id, userId } });
  if (!existing) throw Errors.notFound("Link");

  if (input.originalUrl) assertNotSelfShorten(input.originalUrl);

  let slug = existing.slug;
  if (input.slug && normalizeSlug(input.slug) !== existing.slug) {
    slug = await uniqueSlug(input.slug);
  }

  const link = await prisma.link.update({
    where: { id },
    data: {
      originalUrl: input.originalUrl ?? existing.originalUrl,
      slug,
      title: input.title === undefined ? existing.title : input.title,
      expiresAt:
        input.expiresAt === undefined
          ? existing.expiresAt
          : input.expiresAt
            ? new Date(input.expiresAt)
            : null,
      isActive: input.isActive ?? existing.isActive,
    },
  });

  return serializeLink(link);
}

export async function deleteLink(userId: string, id: string) {
  const existing = await prisma.link.findFirst({ where: { id, userId } });
  if (!existing) throw Errors.notFound("Link");
  await prisma.link.delete({ where: { id } });
  return { ok: true };
}
