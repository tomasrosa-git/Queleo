"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { LibroImportado, ResultadoImportacion } from "@/lib/tipos";

// Cada libro del lote es una consulta al catálogo: de a diez, la espera por
// tanda es corta y se puede mostrar el avance.
const POR_LOTE = 5;

type Props = { alTerminar: () => void };

export function ImportarBiblioteca({ alTerminar }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [importando, setImportando] = useState(false);
  const [avance, setAvance] = useState({ hechos: 0, total: 0 });
  const [resumen, setResumen] = useState<ResultadoImportacion | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function importar(archivo: File) {
    setImportando(true);
    setError(null);
    setResumen(null);

    try {
      const { libros } = await apiFetch<{ libros: LibroImportado[] }>(
        "/importar/analizar",
        { method: "POST", body: JSON.stringify({ csv: await archivo.text() }) },
      );

      if (libros.length === 0) {
        setError("No encontramos libros en ese archivo. ¿Es el CSV que exporta Goodreads?");
        return;
      }

      const total: ResultadoImportacion = {
        importados: 0,
        omitidos: 0,
        noEncontrados: [],
        fallaron: [],
      };
      setAvance({ hechos: 0, total: libros.length });

      for (let i = 0; i < libros.length; i += POR_LOTE) {
        const lote = libros.slice(i, i + POR_LOTE);
        const parcial = await apiFetch<ResultadoImportacion>("/importar", {
          method: "POST",
          body: JSON.stringify({ libros: lote }),
        });

        total.importados += parcial.importados;
        total.omitidos += parcial.omitidos;
        total.noEncontrados.push(...parcial.noEncontrados);
        total.fallaron.push(...parcial.fallaron);
        setAvance({ hechos: Math.min(i + POR_LOTE, libros.length), total: libros.length });
      }

      setResumen(total);
      alTerminar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setImportando(false);
    }
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="cursor-pointer border-none bg-transparent p-0 text-[13px] text-piedra underline hover:text-guinda"
      >
        Importar desde Goodreads
      </button>
    );
  }

  return (
    <section className="border-t border-linea pt-5">
      <p className="mb-2.5 text-[11px] uppercase tracking-[0.1em] text-piedra">
        Importar desde Goodreads
      </p>
      <p className="mb-4 max-w-[58ch] text-[15px] leading-relaxed text-piedra">
        En Goodreads, entrá a <span className="text-tinta">My Books → Import and export</span> y
        pedí el export. Soltá acá el CSV que te manda por mail. Cuantos más libros
        calificados tengas, mejores son las recomendaciones.
      </p>

      <input
        type="file"
        accept=".csv,text/csv"
        disabled={importando}
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          if (archivo) importar(archivo);
        }}
        className="mb-4 block text-[13px] text-piedra file:mr-3 file:cursor-pointer file:rounded-xs file:border file:border-linea file:bg-tarjeta file:px-3 file:py-2 file:text-[13px] file:text-tinta hover:file:border-piedra"
      />

      {importando && (
        <p className="text-[15px] tabular-nums text-piedra">
          Buscando en el catálogo… {avance.hechos} de {avance.total}
        </p>
      )}

      {error && <p className="text-[15px] text-guinda">{error}</p>}

      {resumen && (
        <div className="border-t border-linea pt-4">
          <p className="m-0 text-[15px] leading-relaxed">
            Se agregaron <span className="font-medium tabular-nums">{resumen.importados}</span>{" "}
            libros
            {resumen.omitidos > 0 && (
              <>
                {" "}
                y <span className="tabular-nums">{resumen.omitidos}</span> ya estaban en tu
                biblioteca
              </>
            )}
            .
          </p>

          {resumen.noEncontrados.length > 0 && (
            <p className="mb-0 mt-2 max-w-[58ch] text-[13px] leading-relaxed text-piedra">
              No están en el catálogo: {resumen.noEncontrados.join(", ")}.
            </p>
          )}

          {resumen.fallaron.length > 0 && (
            <p className="mb-0 mt-2 max-w-[58ch] text-[13px] leading-relaxed text-piedra">
              El catálogo no respondió por {resumen.fallaron.join(", ")}. Probá importar el
              archivo de nuevo: lo que ya entró no se duplica.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
