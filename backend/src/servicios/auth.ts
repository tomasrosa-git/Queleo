import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import {
  REFRESH_DAYS,
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
} from "../lib/tokens.js";
import { AppError } from "../middleware/errorHandler.js";

const usuarioPublico = { id: true, email: true, name: true } as const;

async function emitirSesion(userId: string) {
  const { token, tokenHash } = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);

  // Los tokens vencidos ya no sirven para nada y sólo hacen crecer la tabla.
  // Se limpian acá, aprovechando que el usuario está entrando, en vez de
  // montar una tarea programada para algo que puede resolverse solo.
  await prisma.refreshToken.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  });

  await prisma.refreshToken.create({ data: { tokenHash, userId, expiresAt } });

  return { accessToken: signAccessToken(userId), refreshToken: token };
}

export async function register(email: string, password: string, name: string) {
  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    throw new AppError(409, "Ese email ya está registrado");
  }

  const user = await prisma.user.create({
    data: { email, name, passwordHash: await bcrypt.hash(password, 12) },
    select: usuarioPublico,
  });

  return { user, ...(await emitirSesion(user.id)) };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, "Email o contraseña incorrectos");
  }

  return {
    user: { id: user.id, email: user.email, name: user.name },
    ...(await emitirSesion(user.id)),
  };
}

// El refresh token no rota en cada uso: dos pestañas refrescando a la vez
// invalidarían la sesión de la que llegue segunda. Vive sus 30 días y sólo
// se borra al cerrar sesión o al vencer.
export async function refresh(token: string) {
  const guardado = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashRefreshToken(token) },
    include: { user: { select: usuarioPublico } },
  });

  if (!guardado) {
    throw new AppError(401, "Sesión inválida");
  }

  if (guardado.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: guardado.id } });
    throw new AppError(401, "Sesión expirada");
  }

  return {
    user: guardado.user,
    accessToken: signAccessToken(guardado.userId),
  };
}

export async function logout(token: string) {
  await prisma.refreshToken.deleteMany({
    where: { tokenHash: hashRefreshToken(token) },
  });
}
