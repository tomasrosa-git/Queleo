import { describe, expect, it } from "vitest";
import { coincideAutor, coincideTitulo, elegirCoincidencia, normalizar } from "./coincidencia.js";

const libro = (
  titulo: string,
  autores: string[],
  extra: Partial<{ portadaUrl: string | null; isbn: string | null; paginas: number | null }> = {},
) => ({
  titulo,
  autores,
  portadaUrl: extra.portadaUrl ?? null,
  isbn: extra.isbn ?? null,
  paginas: extra.paginas ?? null,
});

describe("normalizar", () => {
  it("saca tildes, mayúsculas y puntuación", () => {
    expect(normalizar("La Invención de Morel")).toBe("la invencion de morel");
    expect(normalizar("¿Qué hacemos con los humanos?")).toBe("que hacemos con los humanos");
  });

  it("colapsa espacios de más", () => {
    expect(normalizar("  Trust   Fall  ")).toBe("trust fall");
  });
});

describe("coincideAutor", () => {
  it("acepta el mismo nombre con el orden invertido", () => {
    expect(coincideAutor("Adolfo Bioy Casares", ["Bioy Casares, Adolfo"])).toBe(true);
  });

  it("tolera erratas de una letra en el nombre de pila", () => {
    // Caso real del catálogo de Google Books.
    expect(coincideAutor("Adolfo Bioy Casares", ["Adolf Bioy Casares"])).toBe(true);
  });

  it("acepta cuando el libro tiene varios autores y uno es el buscado", () => {
    expect(coincideAutor("Adolfo Bioy Casares", ["Adolfo Bioy Casares", "Daniel Martino"])).toBe(true);
  });

  it("rechaza a otra persona", () => {
    expect(coincideAutor("Adolfo Bioy Casares", ["Cristian Natalio De Mattia"])).toBe(false);
    expect(coincideAutor("Hernan Diaz", ["Sarah Mosseri"])).toBe(false);
  });

  it("rechaza cuando no hay autores o el nombre viene vacío", () => {
    expect(coincideAutor("Hernan Diaz", [])).toBe(false);
    expect(coincideAutor("", ["Hernan Diaz"])).toBe(false);
  });

  it("con un apellido suelto alcanza que ese token esté", () => {
    expect(coincideAutor("Bolaño", ["Roberto Bolaño"])).toBe(true);
    expect(coincideAutor("Bolaño", ["Kazuo Ishiguro"])).toBe(false);
  });
});

describe("coincideTitulo", () => {
  it("ignora tildes y mayúsculas", () => {
    expect(coincideTitulo("La invención de Morel", "La Invencion de Morel")).toBe(true);
  });

  it("acepta el subtítulo que Google pega con dos puntos", () => {
    expect(coincideTitulo("Trust", "Trust: Una novela")).toBe(true);
    expect(coincideTitulo("La invención de Morel", "La invención de Morel: novela")).toBe(true);
  });

  it("rechaza un libro que habla SOBRE el libro buscado", () => {
    // El título contiene al buscado, pero no empieza con él.
    expect(
      coincideTitulo(
        "La invención de Morel",
        "El Mundo Fantastico de Adolfo Bioy Casares en La Invencion de Morel",
      ),
    ).toBe(false);
  });

  it("rechaza otro libro del mismo autor", () => {
    expect(coincideTitulo("La invención de Morel", "Plan de evasión")).toBe(false);
  });
});

describe("elegirCoincidencia", () => {
  const propuesta = { titulo: "La invención de Morel", autor: "Adolfo Bioy Casares" };

  it("descarta los resultados que son estudios sobre el libro", () => {
    const elegido = elegirCoincidencia(propuesta, [
      libro("El Mundo Fantastico de Adolfo Bioy Casares en La Invencion de Morel", [
        "Cristian Natalio De Mattia",
      ]),
      libro("La invención de Morel", ["Adolfo Bioy Casares"], { isbn: "9789505810529" }),
    ]);

    expect(elegido?.autores).toEqual(["Adolfo Bioy Casares"]);
  });

  it("entre varias ediciones se queda con la más completa", () => {
    const elegido = elegirCoincidencia(propuesta, [
      libro("La Invencion de Morel", ["Adolfo Bioy Casares"], { isbn: "9789500427685" }),
      libro("La invención de Morel", ["Adolfo Bioy Casares"], {
        portadaUrl: "https://books.google.com/tapa.jpg",
        paginas: 148,
        isbn: "9789505810529",
      }),
      libro("La invención de Morel: novela", ["Adolfo Bioy Casares"], { paginas: 160 }),
    ]);

    expect(elegido?.portadaUrl).toBe("https://books.google.com/tapa.jpg");
  });

  it("devuelve null cuando la IA propuso un libro que no está en el catálogo", () => {
    const elegido = elegirCoincidencia(propuesta, [
      libro("Otra cosa", ["Otro Autor"]),
      libro("Diccionario enciclopédico de las letras de América Latina", []),
    ]);

    expect(elegido).toBeNull();
  });

  it("devuelve null con una lista vacía", () => {
    expect(elegirCoincidencia(propuesta, [])).toBeNull();
  });
});
