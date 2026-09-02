import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ estado: "ok", db: "ok" });
  } catch {
    res.status(503).json({ estado: "degradado", db: "sin conexión" });
  }
});
