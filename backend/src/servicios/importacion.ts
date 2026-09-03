import { parse } from "csv-parse/sync";
import type { EstadoLectura } from "@prisma/client";
import { elegirCoincidencia } from "../lib/coincidencia.js";
import { prisma } from "../lib/prisma.js";
import * as googleBooks from "./googleBooks.js";
import { cachearLibro } from "./libros.js";

export type LibroImportado = {
  titulo: string;
  autor: string;
  isbn: string | null;
  rating: number | null;
  resena: string | null;
  estado: EstadoLectura;
};

const ESTANTES: Record<string, EstadoLectura> = {
  read: "LEIDO",
  "currently-reading": "LEYENDO",
  "to-read": "QUIERO_LEER",
};

// Goodreads exporta los ISBN como fórmula de Excel (="9788433942630") para
// que la planilla no se los coma como número.
function limpiarIsbn(valor: string | undefined): string | null {
  const isbn = (valor ?? "").replace(/^="?|"?$/g, "").trim();
  return isbn.length >= 10 ? isbn : null;
}

// Goodreads puntúa del 1 al 5 y usa el 0 para "sin calificar"; acá la escala
// es del 1 al 10.
function convertirRating(valor: string | undefined): number | null {
  const estrellas = Number(valor);
  if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
    return null;
  }
  return estrellas * 2;
}

function limpiarTexto(valor: string | undefined): string | null {
  const texto = (valor ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
  return texto || null;
}

export function parsearCsvGoodreads(csv: string): LibroImportado[] {
  const filas = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true,
    // Los ISBN vienen como ="9788433942630": esa comilla en medio del campo
    // hace que un parser estricto rechace el archivo entero.
    relax_quotes: true,
  }) as Record<string, string>[];

  const libros = filas
    .map((fila) => {
      const titulo = (fila["Title"] ?? "").trim();
      const autor = (fila["Author"] ?? "").trim();
      if (!titulo || !autor) {
        return null;
      }

      return {
        titulo,
        autor,
        isbn: limpiarIsbn(fila["ISBN13"]) ?? limpiarIsbn(fila["ISBN"]),
        rating: convertirRating(fila["My Rating"]),
        resena: limpiarTexto(fila["My Review"]),
        estado: ESTANTES[(fila["Exclusive Shelf"] ?? "").trim()] ?? "QUIERO_LEER",
      };
    })
    .filter((libro): libro is LibroImportado => libro !== null);

  // Los libros calificados van primero: son los que le dan señal al perfil, y
  // la importación se procesa por lotes.
  return libros.sort((a, b) => Number(b.rating !== null) - Number(a.rating !== null));
}

export type ResultadoImportacion = {
  importados: number;
  omitidos: number;
  noEncontrados: string[];
  fallaron: string[];
};

// Buscar por ISBN no garantiza nada: se vio que el ISBN de Los detectives
// salvajes devuelve una novela de Martin Amis. El resultado se valida igual
// que el de la búsqueda por texto, y si no coincide se busca por título.
async function buscarEnCatalogo(libro: LibroImportado) {
  const propuesta = { titulo: libro.titulo, autor: libro.autor };

  if (libro.isbn) {
    const porIsbn = await googleBooks.buscar(`isbn:${libro.isbn}`);
    const coincide = elegirCoincidencia(propuesta, porIsbn);
    if (coincide) {
      return coincide;
    }
  }

  return elegirCoincidencia(propuesta, await googleBooks.buscar(`${libro.titulo} ${libro.autor}`));
}

export async function importarLote(
  usuarioId: string,
  lote: LibroImportado[],
): Promise<ResultadoImportacion> {
  const resultado: ResultadoImportacion = {
    importados: 0,
    omitidos: 0,
    noEncontrados: [],
    fallaron: [],
  };

  for (const fila of lote) {
    let externo;
    try {
      externo = await buscarEnCatalogo(fila);
    } catch {
      // Que el catálogo falle no es lo mismo que el libro no exista: se
      // reportan aparte para poder reintentar sólo estos.
      resultado.fallaron.push(fila.titulo);
      continue;
    }

    if (!externo) {
      resultado.noEncontrados.push(fila.titulo);
      continue;
    }

    const libro = await cachearLibro(externo);
    const yaEstaba = await prisma.entradaBiblioteca.findUnique({
      where: { usuarioId_libroId: { usuarioId, libroId: libro.id } },
    });

    // Lo que la persona ya cargó a mano gana: la importación no lo pisa.
    if (yaEstaba) {
      resultado.omitidos += 1;
      continue;
    }

    await prisma.entradaBiblioteca.create({
      data: {
        usuarioId,
        libroId: libro.id,
        estado: fila.estado,
        rating: fila.rating,
        resena: fila.resena,
      },
    });
    resultado.importados += 1;
  }

  return resultado;
}
