type Comparacion = { prediccion: number; real: number };

export type Precision = {
  comparaciones: number;
  // Cuánto se desvía en promedio, en puntos de la escala de 1 a 10.
  margen: number;
  // Cuántas veces quedó a un punto o menos del puntaje real.
  cerca: number;
  // Positivo: predice más alto de lo que la persona termina puntuando.
  sesgo: number;
};

// Con dos o tres libros el número no dice nada y daría una falsa sensación de
// precisión, en un sentido o en el otro.
export const MINIMO_COMPARACIONES = 3;

export function calcularPrecision(pares: Comparacion[]): Precision | null {
  if (pares.length < MINIMO_COMPARACIONES) {
    return null;
  }

  const redondear = (n: number) => Math.round(n * 10) / 10;
  const desvios = pares.map((p) => p.prediccion - p.real);

  return {
    comparaciones: pares.length,
    margen: redondear(
      desvios.reduce((total, d) => total + Math.abs(d), 0) / pares.length,
    ),
    cerca: desvios.filter((d) => Math.abs(d) <= 1).length,
    sesgo: redondear(desvios.reduce((total, d) => total + d, 0) / pares.length),
  };
}
