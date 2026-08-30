import type { Request, Response } from "express";
import { getLinkBySlug } from "../services/linkService.js";
import { recordClick } from "../services/clickService.js";
import { qrPng } from "../lib/qr.js";
import { clientIp } from "../lib/geo.js";
import { config } from "../config.js";
import { isLinkExpired, shortUrl } from "../lib/url.js";
import { limiter } from "../lib/rateLimiter.js";

function brandedPage(title: string, heading: string, body: string) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} · Relay</title>
  <style>
    :root { color-scheme: dark; }
    body { margin:0; min-height:100vh; display:grid; place-items:center;
      font-family: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
      background:#0b0d10; color:#e8edf2; }
    .card { max-width: 28rem; padding: 2.5rem; border:1px solid #232a33; border-radius: 18px;
      background:#14181e; }
    .kicker { font-family: ui-monospace, monospace; font-size:11px; letter-spacing:.18em;
      text-transform:uppercase; color:#3dffb0; margin-bottom:12px; }
    h1 { font-size: 1.6rem; margin:0 0 10px; }
    p { color:#8b98a5; line-height:1.55; margin:0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="kicker">Relay</div>
    <h1>${heading}</h1>
    <p>${body}</p>
  </div>
</body>
</html>`;
}

export async function redirectHandler(req: Request, res: Response) {
  const slug = req.params.slug;
  const ip = clientIp(req);
  const rl = limiter.consume(`redir:${ip}`, 300, 60_000);
  if (!rl.allowed) {
    res.status(429).send(brandedPage("Slow down", "Rate limited", "Too many redirects from this network. Try again shortly."));
    return;
  }

  const link = await getLinkBySlug(slug);
  if (!link || !link.isActive) {
    res.status(404).send(
      brandedPage("Not found", "This link does not exist", "The slug is unknown, disabled, or was deleted."),
    );
    return;
  }

  if (isLinkExpired(link.expiresAt)) {
    res.status(410).send(
      brandedPage("Expired", "This link has expired", "The owner set an expiration date that has already passed."),
    );
    return;
  }

  recordClick({
    linkId: link.id,
    ip,
    userAgent: req.header("user-agent") ?? undefined,
    referrer: req.header("referer") ?? undefined,
  }).catch((err) => console.error("click ingest failed", err));

  res.redirect(302, link.originalUrl);
}

export async function qrHandler(req: Request, res: Response) {
  const link = await getLinkBySlug(req.params.slug);
  if (!link || !link.isActive || isLinkExpired(link.expiresAt)) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Link not found" } });
    return;
  }
  const png = await qrPng(shortUrl(config.publicBaseUrl, link.slug));
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(png);
}
