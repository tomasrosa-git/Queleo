import type { Estadisticas } from "@/lib/tipos";

function Dato({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div>
      <div className="text-[26px] font-bold leading-none tabular-nums">{valor}</div>
      <div className="mt-1.5 text-[11px] uppercase tracking-[0.08em] text-piedra">
        {etiqueta}
      </div>
    </div>
  );
}

export function Numeros({ datos }: { datos: Estadisticas }) {
  const maximo = Math.max(...datos.distribucion.map((d) => d.libros), 1);

  return (
    <section className="mb-12 border-y border-linea py-[22px]">
      <p className="mb-5 text-[11px] uppercase tracking-[0.1em] text-piedra">
        Tus números
      </p>

      <div className="mb-8 flex flex-wrap gap-x-10 gap-y-6">
        <Dato valor={String(datos.leidos)} etiqueta="Leídos" />
        {datos.promedio !== null && (
          <Dato valor={datos.promedio.toFixed(1)} etiqueta="Tu promedio" />
        )}
        <Dato valor={datos.paginas.toLocaleString("es-AR")} etiqueta="Páginas" />
        {datos.leyendo > 0 && <Dato valor={String(datos.leyendo)} etiqueta="Leyendo" />}
        {datos.porLeer > 0 && <Dato valor={String(datos.porLeer)} etiqueta="Por leer" />}
      </div>

      {datos.distribucion.length > 0 && (
        <div className="mb-8">
          <p className="mb-3 text-[11px] uppercase tracking-[0.08em] text-piedra">
            Cómo puntuás
          </p>
          <div className="flex items-end gap-1.5" style={{ height: 72 }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((puntaje) => {
              const libros =
                datos.distribucion.find((d) => d.puntaje === puntaje)?.libros ?? 0;
              return (
                <div key={puntaje} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    title={`${libros} libro(s) con ${puntaje}`}
                    className={libros ? "w-full rounded-xs bg-guinda" : "w-full rounded-xs bg-linea"}
                    style={{ height: libros ? `${(libros / maximo) * 56}px` : 2 }}
                  />
                  <span className="text-[10px] tabular-nums text-piedra">{puntaje}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-x-12 gap-y-6">
        {datos.autores.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.08em] text-piedra">
              Volvés a
            </p>
            <ul className="m-0 list-none p-0 text-[15px]">
              {datos.autores.map((autor) => (
                <li key={autor.nombre} className="leading-relaxed">
                  {autor.nombre}{" "}
                  <span className="tabular-nums text-piedra">{autor.libros}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {datos.decadas.length > 1 && (
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.08em] text-piedra">
              De qué décadas leés
            </p>
            <ul className="m-0 list-none p-0 text-[15px] tabular-nums">
              {datos.decadas.map((d) => (
                <li key={d.decada} className="leading-relaxed">
                  {d.decada}s <span className="text-piedra">{d.libros}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
