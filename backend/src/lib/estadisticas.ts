type EntradaParaContar = {
  estado: "QUIERO_LEER" | "LEYENDO" | "LEIDO";
  rating: number | null;
  libro: { autores: string[]; paginas: number | null; anioPublicacion: number | null };
};

export type Estadisticas = {
  leidos: number;
  leyendo: number;
  porLeer: number;
  calificados: number;
  promedio: number | null;
  paginas: number;
  autores: { nombre: string; libros: number }[];
  distribucion: { puntaje: number; libros: number }[];
  decadas: { decada: number; libros: number }[];
};

const AUTORES_EN_RANKING = 5;

export function calcularEstadisticas(entradas: EntradaParaContar[]): Estadisticas {
  const leidas = entradas.filter((e) => e.estado === "LEIDO");
  const puntajes = entradas.map((e) => e.rating).filter((r): r is number => r !== null);

  const porAutor = new Map<string, number>();
  for (const entrada of leidas) {
    for (const autor of entrada.libro.autores) {
      porAutor.set(autor, (porAutor.get(autor) ?? 0) + 1);
    }
  }

  const porDecada = new Map<number, number>();
  for (const entrada of leidas) {
    const anio = entrada.libro.anioPublicacion;
    if (anio) {
      const decada = Math.floor(anio / 10) * 10;
      porDecada.set(decada, (porDecada.get(decada) ?? 0) + 1);
    }
  }

  return {
    leidos: leidas.length,
    leyendo: entradas.filter((e) => e.estado === "LEYENDO").length,
    porLeer: entradas.filter((e) => e.estado === "QUIERO_LEER").length,
    calificados: puntajes.length,
    promedio: puntajes.length
      ? Math.round((puntajes.reduce((a, b) => a + b, 0) / puntajes.length) * 10) / 10
      : null,
    // Sólo lo leído: sumar las páginas de lo que se quiere leer sería contar
    // un logro que no ocurrió.
    paginas: leidas.reduce((total, e) => total + (e.libro.paginas ?? 0), 0),
    autores: [...porAutor.entries()]
      .map(([nombre, libros]) => ({ nombre, libros }))
      .sort((a, b) => b.libros - a.libros || a.nombre.localeCompare(b.nombre))
      .filter((a) => a.libros > 1)
      .slice(0, AUTORES_EN_RANKING),
    distribucion: Array.from({ length: 10 }, (_, i) => ({
      puntaje: i + 1,
      libros: puntajes.filter((p) => p === i + 1).length,
    })).filter((d) => d.libros > 0),
    decadas: [...porDecada.entries()]
      .map(([decada, libros]) => ({ decada, libros }))
      .sort((a, b) => a.decada - b.decada),
  };
}
