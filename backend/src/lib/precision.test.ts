import { describe, expect, it } from "vitest";
import { calcularPrecision } from "./precision.js";

const par = (prediccion: number, real: number) => ({ prediccion, real });

describe("calcularPrecision", () => {
  it("no devuelve nada con menos de tres comparaciones", () => {
    // Con dos libros el número daría una falsa sensación de precisión.
    expect(calcularPrecision([])).toBeNull();
    expect(calcularPrecision([par(8, 8), par(7, 7)])).toBeNull();
  });

  it("mide el desvío promedio sin importar hacia qué lado", () => {
    // Uno se pasa por 2 y otro se queda corto por 2: el margen es 2, no 0.
    const p = calcularPrecision([par(10, 8), par(6, 8), par(8, 8)])!;

    expect(p.margen).toBe(1.3);
    expect(p.comparaciones).toBe(3);
  });

  it("cuenta como cerca las que quedaron a un punto o menos", () => {
    const p = calcularPrecision([par(8, 8), par(9, 8), par(7, 8), par(10, 8)])!;

    // 8, 9 y 7 están a un punto o menos de 8; el 10 no.
    expect(p.cerca).toBe(3);
  });

  it("detecta que predice más alto de lo que la persona puntúa", () => {
    const p = calcularPrecision([par(9, 7), par(8, 7), par(10, 8)])!;

    expect(p.sesgo).toBeGreaterThan(0);
    expect(p.sesgo).toBe(1.7);
  });

  it("detecta el sesgo hacia abajo", () => {
    const p = calcularPrecision([par(6, 8), par(7, 9), par(5, 7)])!;

    expect(p.sesgo).toBe(-2);
  });

  it("no confunde un sesgo nulo con haber acertado", () => {
    // Se pasa por 3 en uno y se queda corto por 3 en otro: el sesgo se
    // cancela, pero el margen tiene que seguir mostrando el error.
    const p = calcularPrecision([par(10, 7), par(4, 7), par(7, 7)])!;

    expect(p.sesgo).toBe(0);
    expect(p.margen).toBe(2);
  });

  it("reconoce la predicción perfecta", () => {
    const p = calcularPrecision([par(8, 8), par(9, 9), par(6, 6)])!;

    expect(p).toEqual({ comparaciones: 3, margen: 0, cerca: 3, sesgo: 0 });
  });

  it("redondea a un decimal", () => {
    const p = calcularPrecision([par(8.7, 8), par(7.2, 7), par(9.1, 9)])!;

    expect(p.margen).toBe(0.3);
  });
});
