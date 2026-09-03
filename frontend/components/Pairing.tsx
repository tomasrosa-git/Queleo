"use client";

import Link from "next/link";
import { useState } from "react";
import { Portada } from "@/components/Portada";
import { apiFetch } from "@/lib/api";
import { fichaTecnica, sinMarkdown, type Pairing as Resultado } from "@/lib/tipos";

const EJEMPLOS = [
  "vi Severance y quiero algo con esa vibra",
  "algo liviano para un viaje largo",
  "algo que me deje pensando una semana",
];

export function Pairing() {
  const [consulta, setConsulta] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (consulta.trim().length < 3) return;

    setBuscando(true);
    setError(null);

    try {
      setResultado(
        await apiFetch<Resultado>("/pairing", {
          method: "POST",
          body: JSON.stringify({ consulta }),
        }),
      );
    } catch (e) {
      setError((e as Error).message);
      setResultado(null);
    } finally {
      setBuscando(false);
    }
  }

  return (
    <section className="border-t border-linea pt-8">
      <p className="mb-2.5 text-[11px] uppercase tracking-[0.1em] text-piedra">
        O contame qué buscás
      </p>
      <p className="mb-5 max-w-[58ch] text-[15px] leading-relaxed text-piedra">
        Un estado de ánimo, una serie que te gustó, una situación. No hace falta
        que sepas el título.
      </p>

      <form onSubmit={enviar} className="mb-4">
        <textarea
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          rows={2}
          placeholder={EJEMPLOS[0]}
          className="mb-3 w-full rounded-xs border border-linea bg-tarjeta px-3 py-2.5 text-[15px] leading-relaxed outline-none focus:border-tinta"
        />
        <button
          type="submit"
          disabled={buscando}
          className="cursor-pointer rounded-xs border-none bg-guinda px-5 py-3 text-[13px] font-medium text-papel hover:bg-guinda-hover disabled:opacity-50"
        >
          {buscando ? "Pensando…" : "Buscar así"}
        </button>
      </form>

      {!resultado && !buscando && (
        <div className="flex flex-wrap gap-2">
          {EJEMPLOS.map((ejemplo) => (
            <button
              key={ejemplo}
              type="button"
              onClick={() => setConsulta(ejemplo)}
              className="cursor-pointer rounded-xs border border-linea bg-transparent px-3 py-1.5 text-[12px] text-piedra hover:border-piedra hover:text-tinta"
            >
              {ejemplo}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-[15px] text-guinda">{error}</p>}

      {resultado && (
        <>
          <div className="mb-2 mt-8 border-y border-linea py-[22px]">
            <p className="mb-2.5 text-[11px] uppercase tracking-[0.1em] text-piedra">
              Cómo entendimos tu pedido
            </p>
            <p className="m-0 max-w-[58ch] text-[15px] leading-relaxed">
              {sinMarkdown(resultado.lectura)}
            </p>
          </div>

          <ul className="m-0 list-none p-0">
            {resultado.sugerencias.map(({ libro, vinculo }) => (
              <li key={libro.googleBooksId} className="border-b border-linea py-6">
                <div className="flex gap-5">
                  <Link href={`/libro/${libro.googleBooksId}`} className="shrink-0">
                    <Portada libro={libro} tamano="h-[114px] w-[76px]" />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link href={`/libro/${libro.googleBooksId}`} className="no-underline">
                      <p className="m-0 text-[17px] font-medium leading-snug">
                        {libro.titulo}
                      </p>
                    </Link>
                    <p className="mb-1.5 mt-1 text-[13px] text-piedra">
                      {libro.autores.join(", ") || "Autor desconocido"}
                    </p>
                    <p className="mb-3 text-[11px] tabular-nums tracking-[0.03em] text-piedra">
                      {fichaTecnica(libro)}
                    </p>
                    <p className="m-0 max-w-[58ch] text-[15px] leading-relaxed">
                      {sinMarkdown(vinculo)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
