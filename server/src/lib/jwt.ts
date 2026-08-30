import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { Errors } from "./errors.js";

export type JwtPayload = {
  sub: string;
  email: string;
};

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    if (!decoded?.sub || !decoded?.email) throw Errors.unauthorized();
    return decoded;
  } catch {
    throw Errors.unauthorized();
  }
}
