type Candidato = {
  titulo: string;
  autores: string[];
  portadaUrl: string | null;
  isbn: string | null;
  paginas: number | null;
};

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Google Books suele pegar el subtítulo al título ("Trust: Una novela"), y
// nuestro propio cacheo hace lo mismo al guardar el volumen.
function tituloBase(titulo: string): string {
  return normalizar(titulo.split(":")[0]);
}

function tokens(nombre: string): Set<string> {
  return new Set(normalizar(nombre).split(" ").filter(Boolean));
}

// "Adolfo Bioy Casares" y "Bioy Casares, Adolfo" son la misma persona, y
// Google Books tiene ediciones cargadas de las dos formas (y con erratas).
export function coincideAutor(propuesto: string, autores: string[]): boolean {
  const buscado = tokens(propuesto);
  if (buscado.size === 0) {
    return false;
  }

  const minimo = Math.min(2, buscado.size);

  return autores.some((autor) => {
    const candidato = tokens(autor);
    const comunes = [...buscado].filter((t) => candidato.has(t)).length;
    return comunes >= minimo;
  });
}

export function coincideTitulo(propuesto: string, titulo: string): boolean {
  const buscado = normalizar(propuesto);
  const base = tituloBase(titulo);

  if (!buscado || !base) {
    return false;
  }

  return base === buscado || base.startsWith(buscado) || buscado.startsWith(base);
}

// Entre varias ediciones del mismo libro conviene la que tenga tapa y ficha
// completa: es la que se va a mostrar.
function riqueza(libro: Candidato): number {
  return (libro.portadaUrl ? 4 : 0) + (libro.paginas ? 2 : 0) + (libro.isbn ? 1 : 0);
}

export function elegirCoincidencia<T extends Candidato>(
  propuesta: { titulo: string; autor: string },
  resultados: T[],
): T | null {
  const coinciden = resultados.filter(
    (libro) =>
      coincideTitulo(propuesta.titulo, libro.titulo) &&
      coincideAutor(propuesta.autor, libro.autores),
  );

  if (coinciden.length === 0) {
    return null;
  }

  return coinciden.reduce((mejor, libro) =>
    riqueza(libro) > riqueza(mejor) ? libro : mejor,
  );
}
