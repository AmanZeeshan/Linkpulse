import { prisma } from "../lib/prisma.js";
import { randomToken, sha256 } from "../lib/hash.js";
import { Errors } from "../lib/errors.js";

function maskPrefix(prefix: string) {
  return `${prefix}…`;
}

export async function createApiKey(userId: string, name: string) {
  const secret = randomToken(24);
  const plaintext = `sk_live_${secret}`;
  const keyPrefix = plaintext.slice(0, 12);

  const record = await prisma.apiKey.create({
    data: {
      userId,
      name,
      keyPrefix,
      keyHash: sha256(plaintext),
    },
  });

  return {
    id: record.id,
    name: record.name,
    keyPrefix: maskPrefix(record.keyPrefix),
    key: plaintext,
    createdAt: record.createdAt,
    lastUsedAt: record.lastUsedAt,
    warning: "Store this key now. Relay will not show it again.",
  };
}

export async function listApiKeys(userId: string) {
  const keys = await prisma.apiKey.findMany({
    where: { userId, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return keys.map((k) => ({
    id: k.id,
    name: k.name,
    keyPrefix: `${k.keyPrefix}…`,
    createdAt: k.createdAt,
    lastUsedAt: k.lastUsedAt,
  }));
}

export async function revokeApiKey(userId: string, id: string) {
  const key = await prisma.apiKey.findFirst({ where: { id, userId, revokedAt: null } });
  if (!key) throw Errors.notFound("API key");
  await prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
  return { ok: true };
}
