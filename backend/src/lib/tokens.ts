import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const ACCESS_EXPIRES_IN = "15m";
export const REFRESH_DAYS = 30;

export function signAccessToken(userId: string) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET!, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
}

export function hashRefreshToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateRefreshToken() {
  const token = crypto.randomBytes(32).toString("base64url");
  return { token, tokenHash: hashRefreshToken(token) };
}
