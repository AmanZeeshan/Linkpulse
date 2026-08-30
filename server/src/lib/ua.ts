import { UAParser } from "ua-parser-js";

export type DeviceInfo = {
  device: string;
  browser: string;
  os: string;
};

export function parseUserAgent(ua: string | undefined): DeviceInfo {
  if (!ua) {
    return { device: "Unknown", browser: "Unknown", os: "Unknown" };
  }

  const parser = new UAParser(ua);
  const result = parser.getResult();
  const type = result.device.type;

  let device = "Desktop";
  if (type === "mobile") device = "Mobile";
  else if (type === "tablet") device = "Tablet";
  else if (type === "wearable") device = "Wearable";
  else if (type === "console") device = "Console";

  return {
    device,
    browser: result.browser.name ?? "Unknown",
    os: result.os.name ?? "Unknown",
  };
}

export function normalizeReferrer(referrer: string | undefined, publicHost: string): string {
  if (!referrer) return "Direct";
  try {
    const url = new URL(referrer);
    if (url.host === publicHost) return "Direct";
    return url.host.replace(/^www\./, "");
  } catch {
    return "Direct";
  }
}
