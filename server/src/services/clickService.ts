import { prisma } from "../lib/prisma.js";
import { lookupGeo } from "../lib/geo.js";
import { normalizeReferrer, parseUserAgent } from "../lib/ua.js";
import { config } from "../config.js";

export async function recordClick(input: {
  linkId: string;
  ip: string;
  userAgent?: string;
  referrer?: string;
}) {
  const geo = lookupGeo(input.ip);
  const device = parseUserAgent(input.userAgent);
  const host = new URL(config.publicBaseUrl).host;
  const referrer = normalizeReferrer(input.referrer, host);

  await prisma.$transaction([
    prisma.click.create({
      data: {
        linkId: input.linkId,
        ip: input.ip,
        country: geo.country,
        city: geo.city,
        region: geo.region,
        device: device.device,
        browser: device.browser,
        os: device.os,
        referrer,
        userAgent: input.userAgent?.slice(0, 512) ?? null,
      },
    }),
    prisma.link.update({
      where: { id: input.linkId },
      data: { clickCount: { increment: 1 } },
    }),
  ]);
}
