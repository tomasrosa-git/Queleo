import type { Libro } from "@/lib/tipos";

type Props = { libro: Libro; prediccion: number };

// El contraste entre la predicción propia y el promedio público es el centro
// de la ficha. El promedio de Google Books existe en pocos volúmenes, así que
// cuando no está se muestra sola la predicción en vez de un hueco.
export function Puntajes({ libro, prediccion }: Props) {
  return (
    <div className="mb-[22px] flex items-end gap-8">
      <div>
        <div className="mb-1 text-[11px] uppercase tracking-[0.08em] text-piedra">
          Tu predicción
        </div>
        <div className="text-[30px] font-bold tabular-nums text-guinda">
          {prediccion.toFixed(1)}
          <span className="text-[14px] font-normal text-piedra">/10</span>
        </div>
      </div>

      {libro.ratingPublico && (
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-[0.08em] text-piedra">
            Promedio público
          </div>
          <div className="text-[18px] font-bold tabular-nums text-tinta">
            {libro.ratingPublico.toFixed(1)}
            <span className="text-[14px] font-normal text-piedra">/5</span>
          </div>
        </div>
      )}
    </div>
  );
}
