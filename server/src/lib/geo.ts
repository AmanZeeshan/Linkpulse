import geoip from "geoip-lite";

export type GeoInfo = {
  country: string | null;
  region: string | null;
  city: string | null;
};

function isPrivate(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("::ffff:127.")
  );
}

export function lookupGeo(ip: string | undefined): GeoInfo {
  if (!ip || isPrivate(ip)) {
    return { country: "Local", region: null, city: "Development" };
  }

  const geo = geoip.lookup(ip);
  if (!geo) {
    return { country: "Unknown", region: null, city: null };
  }

  return {
    country: geo.country || "Unknown",
    region: geo.region || null,
    city: geo.city || null,
  };
}

export function clientIp(req: { headers: Record<string, unknown>; socket: { remoteAddress?: string } }): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]!.trim();
  }
  return req.socket.remoteAddress ?? "127.0.0.1";
}
