"use client";

import { useEffect, useState } from "react";
import { Puntajes } from "@/components/Puntajes";
import { apiFetch } from "@/lib/api";
import { sinMarkdown, type AnalisisLibro, type Libro } from "@/lib/tipos";

export function PanelAnalisis({ libro }: { libro: Libro }) {
  const [analisis, setAnalisis] = useState<AnalisisLibro | null>(null);
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    apiFetch<{ analisis: AnalisisLibro | null }>(
      `/libros/${libro.googleBooksId}/analisis`,
    )
      .then(({ analisis }) => vigente && setAnalisis(analisis))
      .catch(() => {})
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [libro.googleBooksId]);

  async function analizar() {
    setGenerando(true);
    setError(null);

    try {
      const { analisis } = await apiFetch<{ analisis: AnalisisLibro }>(
        `/libros/${libro.googleBooksId}/analisis`,
        { method: "POST" },
      );
      setAnalisis(analisis);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerando(false);
    }
  }

  if (cargando) {
    return null;
  }

  return (
    <section className="mb-11">
      {analisis && (
        <>
          <Puntajes libro={libro} prediccion={analisis.prediccion} />

          <p className="mb-6 max-w-[58ch] text-[15px] leading-relaxed">
            {sinMarkdown(analisis.sinopsis)}
          </p>

          <div className="border-y border-linea py-[22px]">
            <p className="mb-2.5 text-[11px] uppercase tracking-[0.1em] text-piedra">
              Por qué te predecimos ese puntaje
            </p>
            <p className="m-0 max-w-[58ch] text-[15px] leading-relaxed">
              {sinMarkdown(analisis.razonamiento)}
            </p>
          </div>
        </>
      )}

      {error && <p className="mb-4 text-[15px] text-guinda">{error}</p>}

      <button
        type="button"
        onClick={analizar}
        disabled={generando}
        className={`cursor-pointer rounded-xs border-none px-5 py-3 text-[13px] font-medium disabled:opacity-50 ${
          analisis
            ? "mt-5 bg-transparent p-0 text-piedra underline hover:text-guinda"
            : "bg-guinda text-papel hover:bg-guinda-hover"
        }`}
      >
        {generando
          ? "Analizando…"
          : analisis
            ? "Volver a analizar"
            : "¿Me va a gustar?"}
      </button>
    </section>
  );
}
