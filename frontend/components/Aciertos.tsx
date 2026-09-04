import type { Precision } from "@/lib/tipos";

function comoLeerElSesgo(sesgo: number) {
  if (Math.abs(sesgo) < 0.5) {
    return "Sin inclinación clara hacia arriba ni hacia abajo.";
  }

  return sesgo > 0
    ? `Tiende a esperar ${sesgo.toFixed(1)} puntos más de lo que terminás poniendo.`
    : `Tiende a quedarse ${Math.abs(sesgo).toFixed(1)} puntos por debajo de lo que terminás poniendo.`;
}

export function Aciertos({ datos }: { datos: Precision }) {
  return (
    <section className="mb-12 border-y border-linea py-[22px]">
      <p className="mb-2.5 text-[11px] uppercase tracking-[0.1em] text-piedra">
        Qué tan bien te conoce
      </p>

      <p className="m-0 mb-4 max-w-[58ch] text-[15px] leading-relaxed">
        De los <span className="tabular-nums">{datos.comparaciones}</span> libros
        que Queleo predijo antes de que los puntuaras, le erró por{" "}
        <span className="font-medium tabular-nums text-guinda">
          {datos.margen.toFixed(1)}
        </span>{" "}
        puntos en promedio, y quedó a un punto o menos en{" "}
        <span className="tabular-nums">{datos.cerca}</span> de ellos.
      </p>

      <p className="m-0 max-w-[58ch] text-[13px] leading-relaxed text-piedra">
        {comoLeerElSesgo(datos.sesgo)}
      </p>
    </section>
  );
}
