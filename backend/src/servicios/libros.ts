import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import * as googleBooks from "./googleBooks.js";
import type { LibroExterno } from "./googleBooks.js";

export function cachearLibro(externo: LibroExterno) {
  return prisma.libro.upsert({
    where: { googleBooksId: externo.googleBooksId },
    create: externo,
    update: {},
  });
}

// El catálogo local guarda sólo los libros que alguien llegó a abrir o a
// poner en su biblioteca, no los veinte resultados de cada búsqueda.
export async function asegurarLibro(googleBooksId: string) {
  const cacheado = await prisma.libro.findUnique({ where: { googleBooksId } });
  if (cacheado) {
    return cacheado;
  }

  const externo = await googleBooks.porId(googleBooksId);
  if (!externo) {
    throw new AppError(404, "No encontramos ese libro");
  }

  return cachearLibro(externo);
}
