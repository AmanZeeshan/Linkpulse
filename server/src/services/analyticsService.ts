import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { Errors } from "../lib/errors.js";
import { bucketFormat, parseRange } from "../lib/url.js";
import { serializeLink } from "./linkService.js";

type NamedCount = { name: string; count: number };
type Dimension = "country" | "device" | "browser" | "os" | "referrer";

function fillSeries(from: Date | null, to: Date, grain: "hour" | "day", rows: { bucket: string; count: number }[]) {
  const map = new Map(rows.map((r) => [r.bucket, r.count]));
  const points: { t: string; clicks: number }[] = [];
  const start = from ? new Date(from) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  const cursor = new Date(start);
  if (grain === "day") cursor.setUTCHours(0, 0, 0, 0);
  else cursor.setUTCMinutes(0, 0, 0);

  const step = grain === "hour" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  while (cursor.getTime() <= to.getTime()) {
    const key =
      grain === "hour"
        ? cursor.toISOString().slice(0, 13) + ":00"
        : cursor.toISOString().slice(0, 10);
    points.push({ t: key, clicks: map.get(key) ?? 0 });
    cursor.setTime(cursor.getTime() + step);
  }
  return points;
}

async function grouped(where: Prisma.ClickWhereInput, field: Dimension): Promise<NamedCount[]> {
  const rows = await prisma.click.groupBy({
    by: [field],
    where,
    _count: { _all: true },
    orderBy: { _count: { [field]: "desc" } },
    take: 12,
  });
  return rows.map((r) => ({
    name: (r[field] as string | null) || "Unknown",
    count: r._count._all,
  }));
}

async function timeseries(linkIds: string[], from: Date | null, grain: "hour" | "day") {
  if (linkIds.length === 0) return [];

  const clicks = await prisma.click.findMany({
    where: {
      linkId: { in: linkIds },
      ...(from ? { clickedAt: { gte: from } } : {}),
    },
    select: { clickedAt: true },
  });

  const map = new Map<string, number>();
  for (const click of clicks) {
    const key =
      grain === "hour"
        ? click.clickedAt.toISOString().slice(0, 13) + ":00"
        : click.clickedAt.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].map(([bucket, count]) => ({ bucket, count }));
}

export async function linkAnalytics(userId: string, linkId: string, range?: string) {
  const link = await prisma.link.findFirst({ where: { id: linkId, userId } });
  if (!link) throw Errors.notFound("Link");

  const { from, label } = parseRange(range);
  const grain = bucketFormat(label);
  const where: Prisma.ClickWhereInput = { linkId, ...(from ? { clickedAt: { gte: from } } : {}) };

  const [total, unique, seriesRaw, countries, devices, browsers, os, referrers, recent] =
    await Promise.all([
      prisma.click.count({ where }),
      prisma.click.groupBy({ by: ["ip"], where }).then((rows) => rows.length),
      timeseries([linkId], from, grain),
      grouped(where, "country"),
      grouped(where, "device"),
      grouped(where, "browser"),
      grouped(where, "os"),
      grouped(where, "referrer"),
      prisma.click.findMany({
        where: { linkId },
        orderBy: { clickedAt: "desc" },
        take: 25,
      }),
    ]);

  return {
    link: serializeLink(link),
    range: label,
    totals: {
      clicks: total,
      uniqueClicks: unique,
      lifetimeClicks: link.clickCount,
    },
    timeseries: fillSeries(from, new Date(), grain, seriesRaw),
    countries,
    devices,
    browsers,
    os,
    referrers,
    recent,
  };
}

export async function overview(userId: string, range?: string) {
  const { from, label } = parseRange(range);
  const grain = bucketFormat(label);
  const clickWhere: Prisma.ClickWhereInput = {
    link: { userId },
    ...(from ? { clickedAt: { gte: from } } : {}),
  };

  const links = await prisma.link.findMany({ where: { userId }, select: { id: true } });
  const linkIds = links.map((l) => l.id);

  const [linkCount, totalClicks, unique, seriesRaw, countries, devices, browsers, referrers, topLinks, recent] =
    await Promise.all([
      prisma.link.count({ where: { userId } }),
      prisma.click.count({ where: clickWhere }),
      linkIds.length ? prisma.click.groupBy({ by: ["ip"], where: clickWhere }).then((r) => r.length) : 0,
      timeseries(linkIds, from, grain),
      grouped(clickWhere, "country"),
      grouped(clickWhere, "device"),
      grouped(clickWhere, "browser"),
      grouped(clickWhere, "referrer"),
      prisma.link.findMany({
        where: { userId },
        orderBy: { clickCount: "desc" },
        take: 8,
      }),
      prisma.click.findMany({
        where: { link: { userId } },
        include: { link: { select: { slug: true, title: true } } },
        orderBy: { clickedAt: "desc" },
        take: 12,
      }),
    ]);

  return {
    range: label,
    totals: {
      links: linkCount,
      clicks: totalClicks,
      uniqueClicks: unique,
    },
    timeseries: fillSeries(from, new Date(), grain, seriesRaw),
    countries,
    devices,
    browsers,
    referrers,
    topLinks: topLinks.map(serializeLink),
    recent: recent.map((c) => ({
      id: c.id,
      slug: c.link.slug,
      title: c.link.title,
      country: c.country,
      city: c.city,
      device: c.device,
      browser: c.browser,
      referrer: c.referrer,
      clickedAt: c.clickedAt,
    })),
  };
}

export async function exportClicksCsv(userId: string, linkId: string) {
  const link = await prisma.link.findFirst({ where: { id: linkId, userId } });
  if (!link) throw Errors.notFound("Link");

  const clicks = await prisma.click.findMany({
    where: { linkId },
    orderBy: { clickedAt: "desc" },
    take: 10_000,
  });

  const header = ["clickedAt", "country", "region", "city", "device", "browser", "os", "referrer", "ip"];
  const lines = [
    header.join(","),
    ...clicks.map((c) =>
      [c.clickedAt.toISOString(), c.country, c.region, c.city, c.device, c.browser, c.os, c.referrer, c.ip]
        .map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`)
        .join(","),
    ),
  ];
  return { filename: `${link.slug}-clicks.csv`, body: lines.join("\n") };
}
