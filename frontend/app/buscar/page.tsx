"use client";

import { useState } from "react";
import { GrillaLibros } from "@/components/GrillaLibros";
import { Pairing } from "@/components/Pairing";
import { useRequiereSesion } from "@/components/SesionProvider";
import { apiFetch } from "@/lib/api";
import type { Libro } from "@/lib/tipos";

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
      <h1 className="mb-8 font-serif text-[34px] font-bold leading-tight tracking-tight">
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

      {!resultados && !buscando && !error && <Pairing />}

      {resultados && resultados.length > 0 && (
        <GrillaLibros
          items={resultados.map((libro) => ({
            clave: libro.googleBooksId,
            libro,
          }))}
        />
      )}
    </main>
  );
}
