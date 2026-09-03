import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { REFRESH_DAYS } from "../lib/tokens.js";
import { parsear } from "../lib/validacion.js";
import { AppError } from "../middleware/errorHandler.js";
import { rateLimiter } from "../middleware/rateLimiter.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as auth from "../servicios/auth.js";

export const authRouter = Router();

const limitePorIp = rateLimiter({
  ventanaMs: 15 * 60 * 1000,
  maximo: 10,
  mensaje: "Demasiados intentos. Probá de nuevo en unos minutos.",
  clave: (req) => req.ip ?? "anonimo",
});

const COOKIE = "refresh";
const enProduccion = process.env.NODE_ENV === "production";

// En producción el front (Vercel) y la API (Render) son sitios distintos, así
// que la cookie de refresh necesita SameSite=None; en local alcanza con Lax.
const opcionesCookie = {
  httpOnly: true,
  secure: enProduccion,
  sameSite: enProduccion ? ("none" as const) : ("lax" as const),
  maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
  path: "/auth",
};

const registerSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(8, "La contraseña necesita al menos 8 caracteres"),
  name: z.string().trim().min(1, "Falta el nombre"),
});

const googleSchema = z.object({
  credential: z.string().min(1, "Falta el token de Google"),
});

const loginSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(1, "Falta la contraseña"),
});

authRouter.post("/auth/register", limitePorIp, async (req, res) => {
  const { email, password, name } = parsear(registerSchema, req.body);
  const { user, accessToken, refreshToken } = await auth.register(
    email,
    password,
    name,
  );

  res.cookie(COOKIE, refreshToken, opcionesCookie);
  res.status(201).json({ user, accessToken });
});

authRouter.post("/auth/login", limitePorIp, async (req, res) => {
  const { email, password } = parsear(loginSchema, req.body);
  const { user, accessToken, refreshToken } = await auth.login(email, password);

  res.cookie(COOKIE, refreshToken, opcionesCookie);
  res.json({ user, accessToken });
});

authRouter.post("/auth/google", limitePorIp, async (req, res) => {
  const { credential } = parsear(googleSchema, req.body);
  const { user, accessToken, refreshToken } = await auth.loginConGoogle(credential);

  res.cookie(COOKIE, refreshToken, opcionesCookie);
  res.json({ user, accessToken });
});

authRouter.post("/auth/refresh", async (req, res) => {
  const token = req.cookies?.[COOKIE];
  if (!token) {
    throw new AppError(401, "No hay sesión activa");
  }

  res.json(await auth.refresh(token));
});

authRouter.post("/auth/logout", async (req, res) => {
  const token = req.cookies?.[COOKIE];
  if (token) {
    await auth.logout(token);
  }

  res.clearCookie(COOKIE, opcionesCookie);
  res.status(204).end();
});

authRouter.get("/auth/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, name: true },
  });

  res.json({ user });
});
