"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Portada } from "@/components/Portada";
import { useRequiereSesion } from "@/components/SesionProvider";
import { apiFetch } from "@/lib/api";
import { fichaTecnica, type Recomendacion } from "@/lib/tipos";

export default function Descubrir() {
  const { usuario, cargando } = useRequiereSesion();
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[] | null>(null);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!usuario) return;

    let vigente = true;
    apiFetch<{ recomendaciones: Recomendacion[] }>("/recomendaciones")
      .then(({ recomendaciones }) => vigente && setRecomendaciones(recomendaciones))
      .catch((e) => vigente && setError((e as Error).message));

    return () => {
      vigente = false;
    };
  }, [usuario]);

  async function generar() {
    setGenerando(true);
    setError(null);

    try {
      const { recomendaciones } = await apiFetch<{ recomendaciones: Recomendacion[] }>(
        "/recomendaciones",
        { method: "POST" },
      );
      setRecomendaciones(recomendaciones);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerando(false);
    }
  }

  if (cargando || !usuario) {
    return null;
  }

  const hay = recomendaciones && recomendaciones.length > 0;

  return (
    <main>
      <p className="mb-2.5 mt-1 text-[11px] uppercase tracking-[0.1em] text-piedra">
        Descubrir
      </p>
      <h1 className="mb-8 text-[32px] font-bold leading-tight tracking-tight">
        Para vos
      </h1>

      {error && (
        <p className="mb-6 border-y border-linea py-5 text-[15px] leading-relaxed text-guinda">
          {error}
        </p>
      )}

      {recomendaciones && !hay && !error && (
        <p className="mb-8 max-w-[58ch] text-[15px] leading-relaxed text-piedra">
          Todavía no armamos tus recomendaciones. Se calculan a partir de tu perfil
          lector y de lo que tenés en tu biblioteca.
        </p>
      )}

      {hay && (
        <ul className="m-0 mb-10 list-none p-0">
          {recomendaciones.map((recomendacion) => (
            <li
              key={recomendacion.id}
              className="border-b border-linea py-7 first:border-t first:pt-7"
            >
              <div className="mb-4 flex gap-5">
                <Link href={`/libro/${recomendacion.libro.googleBooksId}`} className="shrink-0">
                  <Portada libro={recomendacion.libro} tamano="h-[114px] w-[76px]" />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/libro/${recomendacion.libro.googleBooksId}`}
                    className="no-underline"
                  >
                    <p className="m-0 text-[20px] font-bold leading-tight tracking-tight">
                      {recomendacion.libro.titulo}
                    </p>
                  </Link>
                  <p className="mb-2 mt-1.5 text-[15px] text-piedra">
                    {recomendacion.libro.autores.join(", ") || "Autor desconocido"}
                  </p>
                  <p className="m-0 text-[11px] tabular-nums tracking-[0.03em] text-piedra">
                    {fichaTecnica(recomendacion.libro)}
                  </p>
                </div>
              </div>

              <div className="border-t border-linea pt-4">
                <p className="mb-2 text-[11px] uppercase tracking-[0.1em] text-piedra">
                  Por qué te lo recomendamos
                </p>
                <p className="m-0 max-w-[58ch] text-[15px] leading-relaxed">
                  {recomendacion.razonamiento}
                </p>
                {recomendacion.reparo && (
                  <p className="mb-0 mt-2.5 max-w-[58ch] text-[15px] leading-relaxed text-piedra">
                    {recomendacion.reparo}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={generar}
          disabled={generando}
          className="cursor-pointer rounded-xs border-none bg-guinda px-5 py-3 text-[13px] font-medium text-papel hover:bg-guinda-hover disabled:opacity-50"
        >
          {generando ? "Pensando…" : hay ? "Buscar otras" : "Armar mis recomendaciones"}
        </button>

        <Link href="/buscar" className="text-[13px] text-piedra underline hover:text-guinda">
          Buscar un libro puntual
        </Link>
      </div>
    </main>
  );
}
