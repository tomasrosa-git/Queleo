"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ImportarBiblioteca } from "@/components/ImportarBiblioteca";
import { Portada } from "@/components/Portada";
import { useRequiereSesion } from "@/components/SesionProvider";
import { apiFetch } from "@/lib/api";
import {
  ETIQUETAS_ESTADO,
  type EntradaBiblioteca,
  type EstadoLectura,
} from "@/lib/tipos";

const FILTROS: { valor: EstadoLectura | null; etiqueta: string }[] = [
  { valor: null, etiqueta: "Todo" },
  { valor: "LEYENDO", etiqueta: "Leyendo" },
  { valor: "LEIDO", etiqueta: "Leídos" },
  { valor: "QUIERO_LEER", etiqueta: "Quiero leer" },
];

export default function Biblioteca() {
  const { usuario, cargando } = useRequiereSesion();
  const [filtro, setFiltro] = useState<EstadoLectura | null>(null);
  const [entradas, setEntradas] = useState<EntradaBiblioteca[] | null>(null);
  const [recargar, setRecargar] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!usuario) return;

    let vigente = true;
    apiFetch<{ entradas: EntradaBiblioteca[] }>(
      `/biblioteca${filtro ? `?estado=${filtro}` : ""}`,
    )
      .then(({ entradas }) => vigente && setEntradas(entradas))
      .catch((e) => vigente && setError((e as Error).message));

    return () => {
      vigente = false;
    };
  }, [filtro, usuario, recargar]);

  if (cargando || !usuario) {
    return null;
  }

  return (
    <main>
      <p className="mb-2.5 mt-1 text-[11px] uppercase tracking-[0.1em] text-piedra">
        Biblioteca
      </p>
      <h1 className="mb-8 text-[32px] font-bold leading-tight tracking-tight">
        Tus libros
      </h1>

      <div className="mb-8 flex flex-wrap gap-x-5 gap-y-2 border-b border-linea pb-4 text-[13px] sm:gap-x-6">
        {FILTROS.map(({ valor, etiqueta }) => (
          <button
            key={etiqueta}
            type="button"
            onClick={() => setFiltro(valor)}
            className={`cursor-pointer border-none bg-transparent p-0 uppercase tracking-[0.08em] ${
              filtro === valor ? "text-tinta" : "text-piedra hover:text-tinta"
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {error && <p className="text-[15px] text-guinda">{error}</p>}

      {entradas?.length === 0 &&
        (filtro ? (
          <p className="text-[15px] leading-relaxed text-piedra">
            No tenés libros en «{ETIQUETAS_ESTADO[filtro]}».
          </p>
        ) : (
          <p className="mb-6 text-[15px] leading-relaxed text-piedra">
            Todavía no hay nada acá.{" "}
            <Link href="/buscar" className="text-guinda">
              Buscá un libro
            </Link>{" "}
            para empezar tu biblioteca.
          </p>
        ))}

      {entradas && entradas.length > 0 && (
        <ul className="m-0 list-none p-0">
          {entradas.map((entrada) => (
            <li key={entrada.id} className="border-b border-linea first:border-t">
              <Link
                href={`/libro/${entrada.libro.googleBooksId}`}
                className="flex gap-5 py-5 no-underline"
              >
                <Portada libro={entrada.libro} tamano="h-[84px] w-14" />

                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[17px] font-medium leading-snug">
                    {entrada.libro.titulo}
                  </p>
                  <p className="mb-1.5 mt-1 text-[13px] text-piedra">
                    {entrada.libro.autores.join(", ") || "Autor desconocido"}
                  </p>
                  <p className="m-0 text-[11px] uppercase tracking-[0.08em] text-piedra">
                    {ETIQUETAS_ESTADO[entrada.estado]}
                  </p>
                </div>

                {entrada.rating && (
                  <p className="m-0 shrink-0 text-[18px] font-bold tabular-nums text-guinda">
                    {entrada.rating}
                    <span className="text-[13px] font-normal text-piedra">/10</span>
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-10">
        <ImportarBiblioteca alTerminar={() => setRecargar((n) => n + 1)} />
      </div>
    </main>
  );
}
