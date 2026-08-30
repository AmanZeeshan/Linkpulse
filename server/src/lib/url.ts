export function shortUrl(base: string, slug: string): string {
  return `${base}/${slug}`;
}

export function qrUrl(base: string, slug: string): string {
  return `${base}/${slug}/qr`;
}

export function isLinkExpired(expiresAt: Date | null): boolean {
  return Boolean(expiresAt && expiresAt.getTime() < Date.now());
}

export function parseRange(range: string | undefined): { from: Date | null; label: string } {
  const now = Date.now();
  switch (range) {
    case "24h":
      return { from: new Date(now - 24 * 60 * 60 * 1000), label: "24h" };
    case "30d":
      return { from: new Date(now - 30 * 24 * 60 * 60 * 1000), label: "30d" };
    case "90d":
      return { from: new Date(now - 90 * 24 * 60 * 60 * 1000), label: "90d" };
    case "all":
      return { from: null, label: "all" };
    case "7d":
    default:
      return { from: new Date(now - 7 * 24 * 60 * 60 * 1000), label: "7d" };
  }
}

export function bucketFormat(rangeLabel: string): "hour" | "day" {
  return rangeLabel === "24h" ? "hour" : "day";
}
