import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/prisma.js";
import {
  REFRESH_DAYS,
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
} from "../lib/tokens.js";
import { AppError } from "../middleware/errorHandler.js";

const usuarioPublico = { id: true, email: true, name: true } as const;

function publicoDe(user: { id: string; email: string; name: string }) {
  return { id: user.id, email: user.email, name: user.name };
}

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
  if (!user) {
    throw new AppError(401, "Email o contraseña incorrectos");
  }

  // Una cuenta creada con Google no tiene contraseña que comparar. Este caso
  // sí revela que la cuenta existe, a diferencia del resto: la alternativa
  // sería dejar a esa persona probando contraseñas que nunca eligió.
  if (!user.passwordHash) {
    throw new AppError(409, "Esta cuenta entra con Google. Usá ese botón para ingresar.");
  }

  if (!(await bcrypt.compare(password, user.passwordHash))) {
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

const google = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Llega el ID token que emite Google en el navegador; hay que verificarlo
// contra las claves de Google antes de confiar en nada de lo que dice.
export async function loginConGoogle(credential: string) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new AppError(503, "El ingreso con Google no está configurado.");
  }

  let datos;
  try {
    const ticket = await google.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    datos = ticket.getPayload();
  } catch {
    throw new AppError(401, "No pudimos validar tu cuenta de Google.");
  }

  if (!datos?.sub || !datos.email) {
    throw new AppError(401, "Google no devolvió los datos necesarios.");
  }

  // Sin email verificado no se vincula con una cuenta existente: alguien
  // podría haber registrado una cuenta con un email ajeno y quedarse con ella.
  if (!datos.email_verified) {
    throw new AppError(401, "Tu email de Google no está verificado.");
  }

  const porGoogle = await prisma.user.findUnique({ where: { googleId: datos.sub } });
  if (porGoogle) {
    return { user: publicoDe(porGoogle), ...(await emitirSesion(porGoogle.id)) };
  }

  // Mismo email verificado es la misma persona: se vincula en vez de fallar
  // con "ese email ya está registrado", que sería un callejón sin salida.
  const porEmail = await prisma.user.findUnique({ where: { email: datos.email } });
  if (porEmail) {
    const vinculado = await prisma.user.update({
      where: { id: porEmail.id },
      data: { googleId: datos.sub },
    });
    return { user: publicoDe(vinculado), ...(await emitirSesion(vinculado.id)) };
  }

  const creado = await prisma.user.create({
    data: {
      email: datos.email,
      googleId: datos.sub,
      name: datos.name?.trim() || datos.email.split("@")[0],
    },
  });

  return { user: publicoDe(creado), ...(await emitirSesion(creado.id)) };
}
