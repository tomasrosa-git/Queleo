import type { EstadoLectura } from "@prisma/client";
import { calcularEstadisticas } from "../lib/estadisticas.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { asegurarLibro } from "./libros.js";

export type DatosEntrada = {
  estado: EstadoLectura;
  rating?: number | null;
  resena?: string | null;
};

export function listar(usuarioId: string, estado?: EstadoLectura) {
  return prisma.entradaBiblioteca.findMany({
    where: { usuarioId, ...(estado ? { estado } : {}) },
    include: { libro: true },
    orderBy: { actualizadaEn: "desc" },
  });
}

export function porLibro(usuarioId: string, googleBooksId: string) {
  return prisma.entradaBiblioteca.findFirst({
    where: { usuarioId, libro: { googleBooksId } },
    include: { libro: true },
  });
}

export async function guardar(
  usuarioId: string,
  googleBooksId: string,
  datos: DatosEntrada,
) {
  const libro = await asegurarLibro(googleBooksId);

  return prisma.entradaBiblioteca.upsert({
    where: { usuarioId_libroId: { usuarioId, libroId: libro.id } },
    create: { usuarioId, libroId: libro.id, ...datos },
    update: datos,
    include: { libro: true },
  });
}

export async function eliminar(usuarioId: string, googleBooksId: string) {
  const entrada = await porLibro(usuarioId, googleBooksId);
  if (!entrada) {
    throw new AppError(404, "Ese libro no está en tu biblioteca");
  }

  await prisma.entradaBiblioteca.delete({ where: { id: entrada.id } });
}

export async function estadisticas(usuarioId: string) {
  const entradas = await prisma.entradaBiblioteca.findMany({
    where: { usuarioId },
    select: {
      estado: true,
      rating: true,
      libro: { select: { autores: true, paginas: true, anioPublicacion: true } },
    },
  });

  return calcularEstadisticas(entradas);
}

// Los mejor puntuados, para el estante: es lo que representa el gusto de la
// persona, no lo último que agregó.
export function destacados(usuarioId: string, cuantos: number) {
  return prisma.entradaBiblioteca.findMany({
    where: { usuarioId, estado: "LEIDO", rating: { not: null } },
    include: { libro: true },
    orderBy: [{ rating: "desc" }, { actualizadaEn: "desc" }],
    take: cuantos,
  });
}
