"use client";

import { useState } from "react";
import { useRequiereSesion } from "@/components/SesionProvider";
import { apiFetch } from "@/lib/api";

type Libro = {
  googleBooksId: string;
  titulo: string;
  autores: string[];
  isbn: string | null;
  portadaUrl: string | null;
  anioPublicacion: number | null;
  paginas: number | null;
};

export default function Buscar() {
  const { usuario, cargando } = useRequiereSesion();
  const [consulta, setConsulta] = useState("");
  const [resultados, setResultados] = useState<Libro[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!consulta.trim()) return;

    setBuscando(true);
    setError(null);

    try {
      const { resultados } = await apiFetch<{ resultados: Libro[] }>(
        `/libros/buscar?q=${encodeURIComponent(consulta)}`,
      );
      setResultados(resultados);
    } catch (e) {
      setError((e as Error).message);
      setResultados(null);
    } finally {
      setBuscando(false);
    }
  }

  if (cargando || !usuario) {
    return null;
  }

  return (
    <main>
      <p className="mb-2.5 mt-1 text-[11px] uppercase tracking-[0.1em] text-piedra">
        Descubrir
      </p>
      <h1 className="mb-8 text-[32px] font-bold leading-tight tracking-tight">
        Buscar un libro
      </h1>

      <form onSubmit={enviar} className="mb-10 flex gap-2">
        <input
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="Título, autor o ISBN"
          className="flex-1 rounded-xs border border-linea bg-tarjeta px-3 py-2.5 text-[15px] outline-none focus:border-tinta"
        />
        <button
          type="submit"
          disabled={buscando}
          className="cursor-pointer rounded-xs border-none bg-guinda px-5 py-3 text-[13px] font-medium text-papel hover:bg-guinda-hover disabled:opacity-50"
        >
          {buscando ? "Buscando…" : "Buscar"}
        </button>
      </form>

      {error && (
        <p className="border-y border-linea py-5 text-[15px] text-guinda">{error}</p>
      )}

      {resultados?.length === 0 && (
        <p className="border-y border-linea py-5 text-[15px] text-piedra">
          No encontramos nada para “{consulta}”.
        </p>
      )}

      {resultados && resultados.length > 0 && (
        <ul className="m-0 list-none p-0">
          {resultados.map((libro) => (
            <li
              key={libro.googleBooksId}
              className="flex gap-5 border-b border-linea py-5 first:border-t"
            >
              {libro.portadaUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={libro.portadaUrl}
                  alt=""
                  className="h-[84px] w-14 shrink-0 rounded-xs object-cover"
                />
              ) : (
                <div className="h-[84px] w-14 shrink-0 rounded-xs bg-linea" />
              )}

              <div className="min-w-0">
                <p className="m-0 text-[17px] font-medium leading-snug">{libro.titulo}</p>
                <p className="mb-1.5 mt-1 text-[13px] text-piedra">
                  {libro.autores.join(", ") || "Autor desconocido"}
                </p>
                <p className="m-0 text-[11px] tabular-nums tracking-[0.03em] text-piedra">
                  {[
                    libro.anioPublicacion,
                    libro.paginas && `${libro.paginas} páginas`,
                    libro.isbn && `ISBN ${libro.isbn}`,
                  ]
                    .filter(Boolean)
                    .join(" — ")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
