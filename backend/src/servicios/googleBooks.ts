import { AppError } from "../middleware/errorHandler.js";

const API = "https://www.googleapis.com/books/v1/volumes";

// Sin key propia, Google Books cuenta el request contra una cuota anónima
// compartida entre todos los proyectos sin autenticar, que suele estar agotada.
function conKey(url: string) {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  return key ? `${url}&key=${key}` : url;
}

function fallo(status: number, cuerpo?: string): never {
  console.error("Google Books respondió", status, (cuerpo ?? "").slice(0, 200));
  if (status === 429) {
    throw new AppError(
      503,
      "El catálogo alcanzó su límite de consultas por hoy. Volvé a intentar más tarde.",
    );
  }
  throw new AppError(502, "No se pudo consultar el catálogo de Google Books");
}

export type LibroExterno = {
  googleBooksId: string;
  titulo: string;
  autores: string[];
  isbn: string | null;
  portadaUrl: string | null;
  anioPublicacion: number | null;
  paginas: number | null;
};

type Identificador = { type?: string; identifier?: string };
type Portada = { thumbnail?: string; smallThumbnail?: string };

type Volumen = {
  id?: string;
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publishedDate?: string;
    pageCount?: number;
    industryIdentifiers?: Identificador[];
    imageLinks?: Portada;
  };
};

function extraerIsbn(ids?: Identificador[]) {
  const isbn13 = ids?.find((i) => i.type === "ISBN_13")?.identifier;
  const isbn10 = ids?.find((i) => i.type === "ISBN_10")?.identifier;
  return isbn13 ?? isbn10 ?? null;
}

function extraerAnio(publishedDate?: string) {
  const anio = Number(publishedDate?.slice(0, 4));
  return Number.isInteger(anio) ? anio : null;
}

// Google Books devuelve las tapas por http://, que el navegador bloquea como
// contenido mixto al servirse la página por https.
function normalizarPortada(imageLinks?: Portada) {
  const url = imageLinks?.thumbnail ?? imageLinks?.smallThumbnail;
  return url ? url.replace(/^http:\/\//, "https://") : null;
}

export function parsearVolumen(volumen: Volumen): LibroExterno | null {
  const info = volumen.volumeInfo;
  if (!volumen.id || !info?.title) {
    return null;
  }

  return {
    googleBooksId: volumen.id,
    titulo: info.subtitle ? `${info.title}: ${info.subtitle}` : info.title,
    autores: info.authors ?? [],
    isbn: extraerIsbn(info.industryIdentifiers),
    portadaUrl: normalizarPortada(info.imageLinks),
    anioPublicacion: extraerAnio(info.publishedDate),
    paginas: info.pageCount && info.pageCount > 0 ? info.pageCount : null,
  };
}

export function parsearRespuesta(datos: { items?: Volumen[] }): LibroExterno[] {
  return (datos.items ?? [])
    .map(parsearVolumen)
    .filter((libro): libro is LibroExterno => libro !== null);
}

export async function buscar(consulta: string): Promise<LibroExterno[]> {
  const res = await fetch(
    conKey(`${API}?q=${encodeURIComponent(consulta)}&maxResults=20`),
  );
  if (!res.ok) {
    fallo(res.status, await res.text());
  }

  return parsearRespuesta(await res.json());
}

export async function porId(googleBooksId: string): Promise<LibroExterno | null> {
  const res = await fetch(
    conKey(`${API}/${encodeURIComponent(googleBooksId)}?`),
  );
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    fallo(res.status, await res.text());
  }

  return parsearVolumen(await res.json());
}
