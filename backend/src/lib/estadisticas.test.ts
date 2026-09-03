import { describe, expect, it } from "vitest";
import { calcularEstadisticas } from "./estadisticas.js";

const entrada = (
  estado: "QUIERO_LEER" | "LEYENDO" | "LEIDO",
  rating: number | null,
  libro: Partial<{ autores: string[]; paginas: number | null; anioPublicacion: number | null }> = {},
) => ({
  estado,
  rating,
  libro: {
    autores: libro.autores ?? ["Autor"],
    paginas: libro.paginas ?? null,
    anioPublicacion: libro.anioPublicacion ?? null,
  },
});

describe("calcularEstadisticas", () => {
  it("cuenta cada estado por separado", () => {
    const e = calcularEstadisticas([
      entrada("LEIDO", 8),
      entrada("LEIDO", 6),
      entrada("LEYENDO", null),
      entrada("QUIERO_LEER", null),
      entrada("QUIERO_LEER", null),
    ]);

    expect(e).toMatchObject({ leidos: 2, leyendo: 1, porLeer: 2, calificados: 2 });
  });

  it("promedia sólo lo calificado y redondea a un decimal", () => {
    const e = calcularEstadisticas([
      entrada("LEIDO", 9),
      entrada("LEIDO", 8),
      entrada("LEIDO", null),
    ]);

    expect(e.promedio).toBe(8.5);
  });

  it("no divide por cero cuando no hay nada calificado", () => {
    const e = calcularEstadisticas([entrada("QUIERO_LEER", null)]);

    expect(e.promedio).toBeNull();
    expect(e.calificados).toBe(0);
  });

  it("suma las páginas de lo leído y no las de la lista de pendientes", () => {
    // Contar las páginas de lo que se quiere leer sería atribuirle a alguien
    // un logro que no ocurrió.
    const e = calcularEstadisticas([
      entrada("LEIDO", 8, { paginas: 300 }),
      entrada("LEIDO", 7, { paginas: 200 }),
      entrada("QUIERO_LEER", null, { paginas: 900 }),
      entrada("LEIDO", 7, { paginas: null }),
    ]);

    expect(e.paginas).toBe(500);
  });

  it("rankea autores por cantidad y sólo si repiten", () => {
    const e = calcularEstadisticas([
      entrada("LEIDO", 9, { autores: ["Bolaño"] }),
      entrada("LEIDO", 8, { autores: ["Bolaño"] }),
      entrada("LEIDO", 7, { autores: ["Bolaño"] }),
      entrada("LEIDO", 9, { autores: ["Borges"] }),
      entrada("LEIDO", 8, { autores: ["Borges"] }),
      entrada("LEIDO", 6, { autores: ["Rulfo"] }),
    ]);

    // Rulfo aparece una sola vez: no es un patrón, es una lectura suelta.
    expect(e.autores).toEqual([
      { nombre: "Bolaño", libros: 3 },
      { nombre: "Borges", libros: 2 },
    ]);
  });

  it("cuenta a los dos autores de un libro escrito a cuatro manos", () => {
    const e = calcularEstadisticas([
      entrada("LEIDO", 8, { autores: ["Bioy Casares", "Borges"] }),
      entrada("LEIDO", 9, { autores: ["Borges"] }),
    ]);

    expect(e.autores).toEqual([{ nombre: "Borges", libros: 2 }]);
  });

  it("no cuenta como autor leído a quien está en la lista de pendientes", () => {
    const e = calcularEstadisticas([
      entrada("QUIERO_LEER", null, { autores: ["Sebald"] }),
      entrada("QUIERO_LEER", null, { autores: ["Sebald"] }),
    ]);

    expect(e.autores).toEqual([]);
  });

  it("arma la distribución de puntajes salteando los vacíos", () => {
    const e = calcularEstadisticas([
      entrada("LEIDO", 10),
      entrada("LEIDO", 10),
      entrada("LEIDO", 7),
    ]);

    expect(e.distribucion).toEqual([
      { puntaje: 7, libros: 1 },
      { puntaje: 10, libros: 2 },
    ]);
  });

  it("agrupa por década y las devuelve en orden", () => {
    const e = calcularEstadisticas([
      entrada("LEIDO", 8, { anioPublicacion: 2022 }),
      entrada("LEIDO", 8, { anioPublicacion: 2019 }),
      entrada("LEIDO", 8, { anioPublicacion: 1955 }),
      entrada("LEIDO", 8, { anioPublicacion: null }),
    ]);

    expect(e.decadas).toEqual([
      { decada: 1950, libros: 1 },
      { decada: 2010, libros: 1 },
      { decada: 2020, libros: 1 },
    ]);
  });

  it("devuelve todo en cero con una biblioteca vacía", () => {
    const e = calcularEstadisticas([]);

    expect(e).toEqual({
      leidos: 0,
      leyendo: 0,
      porLeer: 0,
      calificados: 0,
      promedio: null,
      paginas: 0,
      autores: [],
      distribucion: [],
      decadas: [],
    });
  });
});
