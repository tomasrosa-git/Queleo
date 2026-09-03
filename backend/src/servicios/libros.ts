import { elegirCoincidencia } from "../lib/coincidencia.js";
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

type Propuesta = { titulo: string; autor: string };

// La IA propone títulos de memoria: algunos no existen o el catálogo no los
// encuentra, y esos se descartan en vez de mostrarse sin tapa ni ficha.
// Las búsquedas van de a una porque varias en paralelo son un pico que Google
// Books rechaza.
export async function resolverPropuestas<T extends Propuesta>(
  propuestas: T[],
  cuantas: number,
) {
  const halladas: { propuesta: T; libro: LibroExterno }[] = [];

  // Un 503 del catálogo en una búsqueda no puede tirar abajo toda la
  // respuesta: la llamada a la IA ya se pagó con cuota, así que se salta esa
  // propuesta y se sigue con las demás.
  let fallos = 0;
  for (const propuesta of propuestas) {
    if (halladas.length === cuantas) {
      break;
    }

    try {
      const resultados = await googleBooks.buscar(`${propuesta.titulo} ${propuesta.autor}`);
      const libro = elegirCoincidencia(propuesta, resultados);
      if (libro) {
        halladas.push({ propuesta, libro });
      }
    } catch {
      fallos += 1;
    }
  }

  if (halladas.length === 0 && fallos > 0) {
    throw new AppError(502, "No pudimos consultar el catálogo en este momento.");
  }

  return halladas;
}
