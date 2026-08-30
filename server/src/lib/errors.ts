export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  unauthorized: () => new AppError(401, "UNAUTHORIZED", "Authentication required"),
  forbidden: () => new AppError(403, "FORBIDDEN", "You do not have access to this resource"),
  notFound: (entity = "Resource") => new AppError(404, "NOT_FOUND", `${entity} not found`),
  conflict: (code: string, message: string) => new AppError(409, code, message),
  validation: (message: string, details?: unknown) =>
    new AppError(400, "VALIDATION_ERROR", message, details),
  rateLimited: (retryAfterSec: number) =>
    new AppError(429, "RATE_LIMITED", "Too many requests", { retryAfterSec }),
  gone: (message: string) => new AppError(410, "EXPIRED", message),
};
