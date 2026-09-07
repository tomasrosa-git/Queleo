"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GrillaLibros } from "@/components/GrillaLibros";
import { ImportarBiblioteca } from "@/components/ImportarBiblioteca";
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

// El orden cuenta una historia: lo que está leyendo ahora, lo que se propuso
// leer, y recién después el archivo de lo terminado.
const SECCIONES: { estado: EstadoLectura; titulo: string }[] = [
  { estado: "LEYENDO", titulo: "Leyendo" },
  { estado: "QUIERO_LEER", titulo: "Quiero leer" },
  { estado: "LEIDO", titulo: "Leídos" },
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

function comoItems(entradas: EntradaBiblioteca[]) {
  return entradas.map((entrada) => ({
    clave: entrada.id,
    libro: entrada.libro,
    marca: entrada.rating ? String(entrada.rating) : null,
  }));
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
      <h1 className="mb-8 font-serif text-[34px] font-bold leading-tight tracking-tight">
        Tus libros
        {entradas && entradas.length > 0 && (
          <span className="ml-3 align-middle font-sans text-[15px] font-normal tabular-nums text-piedra">
            {entradas.length}
          </span>
        )}
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

      {/* Con un estado elegido la grilla va sola; en "Todo" se agrupa, porque
          si no el estado de cada libro se pierde al sacar el rótulo por fila. */}
      {visibles && visibles.length > 0 && filtro && <GrillaLibros items={comoItems(visibles)} />}

      {visibles &&
        visibles.length > 0 &&
        !filtro &&
        SECCIONES.map(({ estado, titulo }) => {
          const delEstado = visibles.filter((entrada) => entrada.estado === estado);
          if (delEstado.length === 0) {
            return null;
          }

          return (
            <section key={estado} className="mb-11">
              <h2 className="mb-5 border-b border-linea pb-2 text-[11px] uppercase tracking-[0.1em] text-piedra">
                {titulo}
                <span className="ml-2 tabular-nums">{delEstado.length}</span>
              </h2>
              <GrillaLibros items={comoItems(delEstado)} />
            </section>
          );
        })}

      <div className="mt-10">
        <ImportarBiblioteca alTerminar={() => setRecargar((n) => n + 1)} />
      </div>
    </main>
  );
}
