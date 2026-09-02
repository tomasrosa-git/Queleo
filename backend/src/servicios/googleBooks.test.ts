import { describe, expect, it } from "vitest";
import { parsearRespuesta, parsearVolumen } from "./googleBooks.js";

const completo = {
  id: "abc123",
  volumeInfo: {
    title: "Los detectives salvajes",
    authors: ["Roberto Bolaño"],
    publishedDate: "1998-11-02",
    pageCount: 609,
    industryIdentifiers: [
      { type: "ISBN_10", identifier: "8433966057" },
      { type: "ISBN_13", identifier: "9788433966056" },
    ],
    imageLinks: { thumbnail: "http://books.google.com/tapa.jpg" },
  },
};

describe("parsearVolumen", () => {
  it("mapea un volumen completo", () => {
    expect(parsearVolumen(completo)).toEqual({
      googleBooksId: "abc123",
      titulo: "Los detectives salvajes",
      autores: ["Roberto Bolaño"],
      isbn: "9788433966056",
      portadaUrl: "https://books.google.com/tapa.jpg",
      anioPublicacion: 1998,
      paginas: 609,
    });
  });

  it("descarta volúmenes sin id o sin título", () => {
    expect(parsearVolumen({ volumeInfo: { title: "Sin id" } })).toBeNull();
    expect(parsearVolumen({ id: "x", volumeInfo: {} })).toBeNull();
    expect(parsearVolumen({ id: "x" })).toBeNull();
  });

  it("prefiere ISBN_13 sobre ISBN_10 y tolera que no haya ninguno", () => {
    const soloIsbn10 = {
      id: "x",
      volumeInfo: {
        title: "T",
        industryIdentifiers: [{ type: "ISBN_10", identifier: "8433966057" }],
      },
    };
    expect(parsearVolumen(soloIsbn10)?.isbn).toBe("8433966057");

    const otro = {
      id: "x",
      volumeInfo: {
        title: "T",
        industryIdentifiers: [{ type: "OTHER", identifier: "XYZ" }],
      },
    };
    expect(parsearVolumen(otro)?.isbn).toBeNull();
    expect(parsearVolumen({ id: "x", volumeInfo: { title: "T" } })?.isbn).toBeNull();
  });

  it("extrae el año de las tres formas de publishedDate", () => {
    const anio = (publishedDate?: string) =>
      parsearVolumen({ id: "x", volumeInfo: { title: "T", publishedDate } })
        ?.anioPublicacion;

    expect(anio("2019-03-01")).toBe(2019);
    expect(anio("2019-03")).toBe(2019);
    expect(anio("2019")).toBe(2019);
    expect(anio(undefined)).toBeNull();
    expect(anio("s.f.")).toBeNull();
  });

  it("fuerza https en la portada para que no la bloquee el navegador", () => {
    const portada = (imageLinks: Record<string, string>) =>
      parsearVolumen({ id: "x", volumeInfo: { title: "T", imageLinks } })
        ?.portadaUrl;

    expect(portada({ thumbnail: "http://books.google.com/t.jpg" })).toBe(
      "https://books.google.com/t.jpg",
    );
    expect(portada({ smallThumbnail: "http://books.google.com/s.jpg" })).toBe(
      "https://books.google.com/s.jpg",
    );
    expect(parsearVolumen({ id: "x", volumeInfo: { title: "T" } })?.portadaUrl).toBeNull();
  });

  it("trata pageCount 0 como dato ausente", () => {
    const conCero = { id: "x", volumeInfo: { title: "T", pageCount: 0 } };
    expect(parsearVolumen(conCero)?.paginas).toBeNull();
  });

  it("devuelve autores vacío en vez de undefined cuando el volumen no los trae", () => {
    expect(parsearVolumen({ id: "x", volumeInfo: { title: "T" } })?.autores).toEqual([]);
  });

  it("concatena el subtítulo al título", () => {
    const conSubtitulo = {
      id: "x",
      volumeInfo: { title: "Trust", subtitle: "Una novela" },
    };
    expect(parsearVolumen(conSubtitulo)?.titulo).toBe("Trust: Una novela");
  });
});

describe("parsearRespuesta", () => {
  it("devuelve lista vacía cuando la búsqueda no trae items", () => {
    expect(parsearRespuesta({})).toEqual([]);
    expect(parsearRespuesta({ items: [] })).toEqual([]);
  });

  it("filtra los volúmenes que no se pudieron parsear", () => {
    const resultado = parsearRespuesta({
      items: [completo, { id: "sin-titulo", volumeInfo: {} }],
    });

    expect(resultado).toHaveLength(1);
    expect(resultado[0].googleBooksId).toBe("abc123");
  });
});
