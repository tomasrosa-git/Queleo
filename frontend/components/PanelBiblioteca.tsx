"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  ETIQUETAS_ESTADO,
  type EntradaBiblioteca,
  type EstadoLectura,
} from "@/lib/tipos";

const ESTADOS: EstadoLectura[] = ["QUIERO_LEER", "LEYENDO", "LEIDO"];

type Props = {
  googleBooksId: string;
  entrada: EntradaBiblioteca | null;
  onCambio: (entrada: EntradaBiblioteca | null) => void;
};

export function PanelBiblioteca({ googleBooksId, entrada, onCambio }: Props) {
  const [estado, setEstado] = useState<EstadoLectura | null>(entrada?.estado ?? null);
  const [rating, setRating] = useState(entrada?.rating?.toString() ?? "");
  const [resena, setResena] = useState(entrada?.resena ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  async function guardar(nuevoEstado: EstadoLectura) {
    setGuardando(true);
    setError(null);

    try {
      const { entrada } = await apiFetch<{ entrada: EntradaBiblioteca }>(
        `/biblioteca/${googleBooksId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            estado: nuevoEstado,
            rating: rating ? Number(rating) : null,
            resena: resena.trim() || null,
          }),
        },
      );

      setEstado(nuevoEstado);
      onCambio(entrada);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function quitar() {
    setGuardando(true);

    try {
      await apiFetch(`/biblioteca/${googleBooksId}`, { method: "DELETE" });
      setEstado(null);
      setRating("");
      setResena("");
      onCambio(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="border-t border-linea pt-5">
      <p className="mb-3 text-[11px] uppercase tracking-[0.1em] text-piedra">
        Tu biblioteca
      </p>

      <div className="mb-5 flex gap-2">
        {ESTADOS.map((valor) => (
          <button
            key={valor}
            type="button"
            disabled={guardando}
            onClick={() => guardar(valor)}
            className={`cursor-pointer rounded-xs px-4 py-2.5 text-[13px] tracking-[0.02em] disabled:opacity-50 ${
              estado === valor
                ? "border border-guinda bg-guinda text-papel"
                : "border border-linea bg-transparent text-tinta hover:border-piedra"
            }`}
          >
            {ETIQUETAS_ESTADO[valor]}
          </button>
        ))}
      </div>

      {estado && (
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.08em] text-piedra">
              Tu puntaje
            </span>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="rounded-xs border border-linea bg-tarjeta px-3 py-2 text-[15px] tabular-nums outline-none focus:border-tinta"
            >
              <option value="">Sin puntaje</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} / 10
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.08em] text-piedra">
              Tu reseña
            </span>
            <textarea
              value={resena}
              onChange={(e) => setResena(e.target.value)}
              rows={4}
              className="w-full max-w-[58ch] rounded-xs border border-linea bg-tarjeta px-3 py-2.5 text-[15px] leading-relaxed outline-none focus:border-tinta"
            />
          </label>

          <div className="flex items-center gap-4">
            <button
              type="button"
              disabled={guardando}
              onClick={() => guardar(estado)}
              className="cursor-pointer rounded-xs border-none bg-guinda px-5 py-3 text-[13px] font-medium text-papel hover:bg-guinda-hover disabled:opacity-50"
            >
              {guardando ? "Guardando…" : "Guardar"}
            </button>

            {guardado && <span className="text-[13px] text-verde">Guardado</span>}

            <button
              type="button"
              disabled={guardando}
              onClick={quitar}
              className="ml-auto cursor-pointer border-none bg-transparent p-0 text-[13px] text-piedra underline hover:text-guinda disabled:opacity-50"
            >
              Quitar de mi biblioteca
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-[13px] text-guinda">{error}</p>}
    </section>
  );
}
