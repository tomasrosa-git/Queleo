import { describe, expect, it } from "vitest";
import { parsearCsvGoodreads } from "./importacion.js";

const CABECERA =
  "Book Id,Title,Author,ISBN,ISBN13,My Rating,Average Rating,Number of Pages,Exclusive Shelf,My Review";

const csv = (...filas: string[]) => [CABECERA, ...filas].join("\n");

describe("parsearCsvGoodreads", () => {
  it("mapea una fila completa", () => {
    const [libro] = parsearCsvGoodreads(
      csv('41880,Trust,Hernan Diaz,="1234567890",="9780593420331",5,4.1,416,read,Excelente'),
    );

    expect(libro).toEqual({
      titulo: "Trust",
      autor: "Hernan Diaz",
      isbn: "9780593420331",
      rating: 10,
      resena: "Excelente",
      estado: "LEIDO",
    });
  });

  it("desarma el formato de fórmula de Excel del ISBN", () => {
    // Goodreads exporta ="9788433942630" para que la planilla no lo trunque.
    const [libro] = parsearCsvGoodreads(
      csv('1,Klara,Ishiguro,="",="9788433942630",4,4.0,384,read,'),
    );
    expect(libro.isbn).toBe("9788433942630");
  });

  it("cae al ISBN de 10 cuando no hay ISBN13, y admite que no haya ninguno", () => {
    const [conIsbn10] = parsearCsvGoodreads(csv('1,T,A,="8433966057",="",3,4.0,100,read,'));
    expect(conIsbn10.isbn).toBe("8433966057");

    const [sinIsbn] = parsearCsvGoodreads(csv('1,T,A,="",="",3,4.0,100,read,'));
    expect(sinIsbn.isbn).toBeNull();
  });

  it("convierte las estrellas de Goodreads a la escala de 1 a 10", () => {
    const puntajes = parsearCsvGoodreads(
      csv(
        '1,A,Autor,="",="",5,4,100,read,',
        '2,B,Autor,="",="",3,4,100,read,',
        '3,C,Autor,="",="",1,4,100,read,',
      ),
    ).map((l) => l.rating);

    expect(puntajes).toEqual([10, 6, 2]);
  });

  it("trata el 0 de Goodreads como sin calificar, no como un cero", () => {
    // Es el caso más peligroso: un 0 literal arruinaría el perfil entero.
    const [libro] = parsearCsvGoodreads(csv('1,T,A,="",="",0,4.0,100,to-read,'));
    expect(libro.rating).toBeNull();
  });

  it("traduce los estantes de Goodreads a los estados propios", () => {
    const estados = parsearCsvGoodreads(
      csv(
        '1,A,Autor,="",="",0,4,100,read,',
        '2,B,Autor,="",="",0,4,100,currently-reading,',
        '3,C,Autor,="",="",0,4,100,to-read,',
        '4,D,Autor,="",="",0,4,100,abandonados,',
      ),
    ).map((l) => l.estado);

    // Un estante propio de la persona no tiene equivalente: va a "quiero leer".
    expect(estados).toEqual(["LEIDO", "LEYENDO", "QUIERO_LEER", "QUIERO_LEER"]);
  });

  it("respeta las comas y comillas dentro de los campos", () => {
    const [libro] = parsearCsvGoodreads(
      csv('1,"Trust: A Novel, Illustrated",Diaz,="",="",4,4,100,read,"Me gustó, aunque el final no"'),
    );

    expect(libro.titulo).toBe("Trust: A Novel, Illustrated");
    expect(libro.resena).toBe("Me gustó, aunque el final no");
  });

  it("saca el HTML que Goodreads deja en las reseñas", () => {
    const [libro] = parsearCsvGoodreads(
      csv('1,T,A,="",="",4,4,100,read,"Primera línea<br/>Segunda <b>importante</b>"'),
    );

    expect(libro.resena).toBe("Primera línea\nSegunda importante");
  });

  it("descarta filas sin título o sin autor", () => {
    const libros = parsearCsvGoodreads(
      csv(
        '1,,Autor sin libro,="",="",0,4,100,read,',
        '2,Libro sin autor,,="",="",0,4,100,read,',
        '3,Válido,Autor,="",="",0,4,100,read,',
      ),
    );

    expect(libros).toHaveLength(1);
    expect(libros[0].titulo).toBe("Válido");
  });

  it("pone primero los libros calificados", () => {
    // La importación va por lotes: los calificados son los que le dan señal
    // al perfil, así que entran aunque se corte antes del final.
    const titulos = parsearCsvGoodreads(
      csv(
        '1,Sin puntaje,Autor,="",="",0,4,100,to-read,',
        '2,Con puntaje,Autor,="",="",4,4,100,read,',
        '3,Otro sin puntaje,Autor,="",="",0,4,100,to-read,',
      ),
    ).map((l) => l.titulo);

    expect(titulos[0]).toBe("Con puntaje");
  });

  it("devuelve lista vacía con un CSV sin filas", () => {
    expect(parsearCsvGoodreads(CABECERA)).toEqual([]);
  });

  it("tolera el BOM que agregan Excel y Windows", () => {
    const conBom = `﻿${csv('1,Trust,Diaz,="",="",4,4,100,read,')}`;
    expect(parsearCsvGoodreads(conBom)[0].titulo).toBe("Trust");
  });
});
