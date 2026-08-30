import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { linksRouter } from "./routes/links.js";
import { keysRouter } from "./routes/keys.js";
import { analyticsRouter } from "./routes/analytics.js";
import { qrHandler, redirectHandler } from "./routes/redirect.js";
import { asyncHandler, errorHandler } from "./middleware/errorHandler.js";
import { randomBytes } from "node:crypto";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    cors({
      origin: [config.clientOrigin, config.publicBaseUrl],
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "32kb" }));

  app.use((req, res, next) => {
    const id = (req.header("x-request-id") as string | undefined) ?? randomBytes(8).toString("hex");
    res.setHeader("x-request-id", id);
    const start = Date.now();
    res.on("finish", () => {
      if (req.path.startsWith("/api") || req.method !== "GET") {
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
      }
    });
    next();
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "relay", time: new Date().toISOString() });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/links", linksRouter);
  app.use("/api/keys", keysRouter);
  app.use("/api/analytics", analyticsRouter);

  app.get("/:slug/qr", asyncHandler(qrHandler));
  app.get("/:slug", asyncHandler(redirectHandler));

  app.use(errorHandler);
  return app;
}
