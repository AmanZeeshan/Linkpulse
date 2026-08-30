import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd: process.env.NODE_ENV === "production",
  jwtSecret: required("JWT_SECRET", "relay-dev-secret-change-in-production-9f3a2c"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  publicBaseUrl: (process.env.PUBLIC_BASE_URL ?? "http://localhost:3001").replace(/\/$/, ""),
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 12),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
} as const;
