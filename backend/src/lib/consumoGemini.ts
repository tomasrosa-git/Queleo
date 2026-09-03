import { modoFixture } from "./fixturesGemini.js";
import { prisma } from "./prisma.js";
import { AppError } from "../middleware/errorHandler.js";

const TECHO_DIARIO = Number(process.env.GEMINI_LIMITE_DIARIO ?? 180);

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

export async function verificarCupo() {
  // Trabajar contra respuestas grabadas no gasta cupo, así que tampoco debe
  // contra el contador ni quedar bloqueado por él.
  if (modoFixture() === "usar") {
    return;
  }

  const consumo = await prisma.consumoGemini.findUnique({ where: { fecha: hoy() } });

  if ((consumo?.llamados ?? 0) >= TECHO_DIARIO) {
    throw new AppError(
      503,
      "Las funciones con IA agotaron su cupo por hoy. Volvé mañana.",
    );
  }
}

export async function registrarLlamado() {
  if (modoFixture() === "usar") {
    return;
  }

  const fecha = hoy();

  await prisma.consumoGemini.upsert({
    where: { fecha },
    create: { fecha, llamados: 1 },
    update: { llamados: { increment: 1 } },
  });
}

export async function consumoDeHoy() {
  const consumo = await prisma.consumoGemini.findUnique({ where: { fecha: hoy() } });

  return { llamados: consumo?.llamados ?? 0, techo: TECHO_DIARIO };
}
