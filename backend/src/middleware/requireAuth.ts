import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/tokens.js";
import { AppError } from "./errorHandler.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "Falta el token de acceso");
  }

  try {
    req.userId = verifyAccessToken(header.slice(7)).sub;
    next();
  } catch {
    throw new AppError(401, "Token de acceso inválido o vencido");
  }
}
