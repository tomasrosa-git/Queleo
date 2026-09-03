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
  ratingPublico: number | null;
  cantidadRatings: number | null;
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

export type RolMensaje = "USUARIO" | "ASISTENTE";

export type MensajeOnboarding = {
  id: string;
  rol: RolMensaje;
  contenido: string;
};

export type PerfilLector = {
  resumen: string;
  generos: string[];
  autores: string[];
  patrones: string[];
  actualizadoEn: string;
};

export type EstadoPerfil = {
  perfil: PerfilLector | null;
  mensajes: MensajeOnboarding[];
  saludo: string;
  consumo: { llamados: number; techo: number };
};

export type Recomendacion = {
  id: string;
  razonamiento: string;
  reparo: string | null;
  libro: Libro;
};

export type AnalisisLibro = {
  id: string;
  sinopsis: string;
  prediccion: number;
  razonamiento: string;
};

// El modelo mete énfasis de markdown aunque se le pida que no, y el texto se
// muestra tal cual: se limpia al renderizar para que valga también para lo
// que ya está guardado.
export function sinMarkdown(texto: string) {
  return texto.replace(/\*\*?([^*\n]+)\*\*?/g, "$1").replace(/_([^_\n]+)_/g, "$1");
}
