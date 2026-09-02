"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PanelBiblioteca } from "@/components/PanelBiblioteca";
import { Portada } from "@/components/Portada";
import { useRequiereSesion } from "@/components/SesionProvider";
import { apiFetch } from "@/lib/api";
import { fichaTecnica, type EntradaBiblioteca, type Libro } from "@/lib/tipos";

export default function FichaLibro() {
  const { id } = useParams<{ id: string }>();
  const { usuario, cargando } = useRequiereSesion();
  const [libro, setLibro] = useState<Libro | null>(null);
  const [entrada, setEntrada] = useState<EntradaBiblioteca | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!usuario) return;

    let vigente = true;
    Promise.all([
      apiFetch<{ libro: Libro }>(`/libros/${id}`),
      apiFetch<{ entrada: EntradaBiblioteca | null }>(`/biblioteca/${id}`),
    ])
      .then(([a, b]) => {
        if (!vigente) return;
        setLibro(a.libro);
        setEntrada(b.entrada);
      })
      .catch((e) => vigente && setError((e as Error).message));

    return () => {
      vigente = false;
    };
  }, [id, usuario]);

  if (cargando || !usuario) {
    return null;
  }

  if (error) {
    return <p className="border-y border-linea py-5 text-[15px] text-guinda">{error}</p>;
  }

  if (!libro) {
    return <p className="text-[15px] text-piedra">Cargando…</p>;
  }

  return (
    <main>
      <div className="mb-11 flex flex-col gap-10 sm:flex-row">
        <Portada libro={libro} tamano="h-[210px] w-[140px] sm:h-[252px] sm:w-[168px]" />

        <div className="min-w-0 flex-1">
          <h1 className="mb-2 text-[32px] font-bold leading-tight tracking-tight">
            {libro.titulo}
          </h1>
          <p className="mb-[18px] text-[15px] text-piedra">
            {libro.autores.join(", ") || "Autor desconocido"}
          </p>
          <p className="border-t border-linea pt-3.5 text-[11px] tabular-nums tracking-[0.03em] text-piedra">
            {fichaTecnica(libro) || "Sin datos de edición"}
          </p>
        </div>
      </div>

      <PanelBiblioteca googleBooksId={id} entrada={entrada} onCambio={setEntrada} />
    </main>
  );
}
