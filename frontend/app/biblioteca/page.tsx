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

type Orden = "reciente" | "puntaje" | "titulo" | "autor" | "anio";

const ORDENES: { valor: Orden; etiqueta: string }[] = [
  { valor: "reciente", etiqueta: "Más reciente" },
  { valor: "puntaje", etiqueta: "Puntaje" },
  { valor: "titulo", etiqueta: "Título" },
  { valor: "autor", etiqueta: "Autor" },
  { valor: "anio", etiqueta: "Año" },
];

// Ordenar y buscar es sobre lo que ya está en pantalla: son bibliotecas de
// decenas de libros, no hace falta volver al servidor por esto.
function ordenar(entradas: EntradaBiblioteca[], orden: Orden) {
  const copia = [...entradas];

  if (orden === "puntaje") {
    // Los que no tienen puntaje van al final, no arriba como haría un null.
    return copia.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
  }
  if (orden === "titulo") {
    return copia.sort((a, b) => a.libro.titulo.localeCompare(b.libro.titulo, "es"));
  }
  if (orden === "autor") {
    return copia.sort((a, b) =>
      (a.libro.autores[0] ?? "").localeCompare(b.libro.autores[0] ?? "", "es"),
    );
  }
  if (orden === "anio") {
    return copia.sort((a, b) => (b.libro.anioPublicacion ?? 0) - (a.libro.anioPublicacion ?? 0));
  }
  return copia;
}

function filtrarPorTexto(entradas: EntradaBiblioteca[], texto: string) {
  const buscado = texto.trim().toLowerCase();
  if (!buscado) {
    return entradas;
  }

  return entradas.filter(
    (entrada) =>
      entrada.libro.titulo.toLowerCase().includes(buscado) ||
      entrada.libro.autores.some((autor) => autor.toLowerCase().includes(buscado)),
  );
}

export default function Biblioteca() {
  const { usuario, cargando } = useRequiereSesion();
  const [filtro, setFiltro] = useState<EstadoLectura | null>(null);
  const [entradas, setEntradas] = useState<EntradaBiblioteca[] | null>(null);
  const [recargar, setRecargar] = useState(0);
  const [orden, setOrden] = useState<Orden>("reciente");
  const [busqueda, setBusqueda] = useState("");
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

  const visibles = entradas ? ordenar(filtrarPorTexto(entradas, busqueda), orden) : null;

  return (
    <main>
      <p className="mb-2.5 mt-1 text-[11px] uppercase tracking-[0.1em] text-piedra">
        Biblioteca
      </p>
      <h1 className="mb-8 text-[32px] font-bold leading-tight tracking-tight">
        Tus libros
      </h1>

      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px] sm:gap-x-6">
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

      {entradas && entradas.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-linea pb-4">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar en tu biblioteca"
            className="min-w-0 flex-1 rounded-xs border border-linea bg-tarjeta px-3 py-2 text-[13px] outline-none focus:border-tinta"
          />
          <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-piedra">
            Orden
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value as Orden)}
              className="rounded-xs border border-linea bg-tarjeta px-2 py-2 text-[13px] normal-case tracking-normal text-tinta outline-none focus:border-tinta"
            >
              {ORDENES.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.etiqueta}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

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

      {visibles && entradas && entradas.length > 0 && visibles.length === 0 && (
        <p className="text-[15px] leading-relaxed text-piedra">
          Ningún libro de tu biblioteca coincide con «{busqueda}».
        </p>
      )}

      {visibles && visibles.length > 0 && (
        <ul className="m-0 list-none p-0">
          {visibles.map((entrada) => (
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
