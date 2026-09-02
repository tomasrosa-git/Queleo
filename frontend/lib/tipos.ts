export type EstadoLectura = "QUIERO_LEER" | "LEYENDO" | "LEIDO";

export const ETIQUETAS_ESTADO: Record<EstadoLectura, string> = {
  QUIERO_LEER: "Quiero leer",
  LEYENDO: "Leyendo",
  LEIDO: "Leído",
};

export type Libro = {
  googleBooksId: string;
  titulo: string;
  autores: string[];
  isbn: string | null;
  portadaUrl: string | null;
  anioPublicacion: number | null;
  paginas: number | null;
};

export type EntradaBiblioteca = {
  id: string;
  estado: EstadoLectura;
  rating: number | null;
  resena: string | null;
  libro: Libro;
};

export function fichaTecnica(libro: Libro) {
  return [
    libro.paginas && `${libro.paginas} páginas`,
    libro.anioPublicacion,
    libro.isbn && `ISBN ${libro.isbn}`,
  ]
    .filter(Boolean)
    .join(" — ");
}
