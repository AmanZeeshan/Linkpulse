import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const COUNTRIES = [
  { country: "US", region: "CA", city: "San Francisco" },
  { country: "US", region: "NY", city: "New York" },
  { country: "GB", region: "ENG", city: "London" },
  { country: "DE", region: "BE", city: "Berlin" },
  { country: "IN", region: "MH", city: "Mumbai" },
  { country: "PK", region: "SD", city: "Karachi" },
  { country: "BR", region: "SP", city: "São Paulo" },
  { country: "JP", region: "13", city: "Tokyo" },
  { country: "CA", region: "ON", city: "Toronto" },
  { country: "AU", region: "NSW", city: "Sydney" },
  { country: "FR", region: "IDF", city: "Paris" },
  { country: "SG", region: "01", city: "Singapore" },
];

const DEVICES = [
  { device: "Desktop", browser: "Chrome", os: "Windows" },
  { device: "Desktop", browser: "Chrome", os: "macOS" },
  { device: "Desktop", browser: "Firefox", os: "Linux" },
  { device: "Desktop", browser: "Edge", os: "Windows" },
  { device: "Desktop", browser: "Safari", os: "macOS" },
  { device: "Mobile", browser: "Safari", os: "iOS" },
  { device: "Mobile", browser: "Chrome", os: "Android" },
  { device: "Tablet", browser: "Safari", os: "iOS" },
  { device: "Mobile", browser: "Samsung Internet", os: "Android" },
];

const REFERRERS = [
  "Direct",
  "google.com",
  "twitter.com",
  "linkedin.com",
  "github.com",
  "reddit.com",
  "news.ycombinator.com",
  "producthunt.com",
  "newsletter.relay.dev",
];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, list: T[]): T {
  return list[Math.floor(rng() * list.length)]!;
}

function skewedDate(rng: () => number, days: number) {
  const bias = rng() ** 1.7;
  const ms = Date.now() - bias * days * 24 * 60 * 60 * 1000;
  return new Date(ms);
}

async function main() {
  await prisma.click.deleteMany();
  await prisma.link.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.user.deleteMany();

  const demo = await prisma.user.create({
    data: {
      email: "demo@relay.dev",
      name: "Aman Zeeshan",
      passwordHash: await bcrypt.hash("Demo1234!", 12),
    },
  });

  const linksSpec = [
    {
      slug: "launch",
      title: "Product launch landing",
      originalUrl: "https://example.com/launch",
      clicks: 420,
    },
    {
      slug: "hiring",
      title: "Engineering hiring page",
      originalUrl: "https://example.com/careers/backend",
      clicks: 186,
    },
    {
      slug: "docs-api",
      title: "Public API docs",
      originalUrl: "https://example.com/docs/api",
      clicks: 310,
    },
    {
      slug: "gh-relay",
      title: "GitHub repository",
      originalUrl: "https://github.com",
      clicks: 254,
    },
    {
      slug: "blog-ratelimit",
      title: "Blog: designing rate limiters",
      originalUrl: "https://example.com/blog/rate-limiters",
      clicks: 97,
    },
    {
      slug: "conf-talk",
      title: "Conference talk slides",
      originalUrl: "https://example.com/talks/short-links",
      clicks: 64,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    {
      slug: "expired-demo",
      title: "Expired campaign (demo)",
      originalUrl: "https://example.com/old-campaign",
      clicks: 22,
      expiresAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const spec of linksSpec) {
    const rng = mulberry32(spec.slug.split("").reduce((a, c) => a + c.charCodeAt(0), 1));
    const link = await prisma.link.create({
      data: {
        userId: demo.id,
        slug: spec.slug,
        title: spec.title,
        originalUrl: spec.originalUrl,
        expiresAt: spec.expiresAt ?? null,
        clickCount: spec.clicks,
      },
    });

    const rows = Array.from({ length: spec.clicks }, () => {
      const geo = pick(rng, COUNTRIES);
      const device = pick(rng, DEVICES);
      return {
        linkId: link.id,
        ip: `203.${Math.floor(rng() * 200)}.${Math.floor(rng() * 200)}.${Math.floor(rng() * 200)}`,
        country: geo.country,
        region: geo.region,
        city: geo.city,
        device: device.device,
        browser: device.browser,
        os: device.os,
        referrer: pick(rng, REFERRERS),
        userAgent: `${device.browser}/${device.os}`,
        clickedAt: skewedDate(rng, 28),
      };
    });

    const chunk = 80;
    for (let i = 0; i < rows.length; i += chunk) {
      await prisma.click.createMany({ data: rows.slice(i, i + chunk) });
    }
  }

  console.log("Seeded demo@relay.dev / Demo1234!");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
