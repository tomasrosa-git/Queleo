import Link from "next/link";
import { telaDe, tituloCorto } from "@/lib/tela";
import type { EntradaBiblioteca } from "@/lib/tipos";

export function Estante({ entradas }: { entradas: EntradaBiblioteca[] }) {
  if (entradas.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <p className="mb-4 text-[13px] uppercase tracking-[0.06em] text-piedra">
        Tu estante
      </p>

      <ul className="m-0 flex list-none items-end gap-2 p-0">
        {entradas.map((entrada) => {
          const tela = telaDe(entrada.libro.titulo);

          return (
            <li key={entrada.id} className="flex-1">
              <Link
                href={`/libro/${entrada.libro.googleBooksId}`}
                title={`${entrada.libro.titulo} — ${entrada.rating}/10`}
                className={`flex h-[148px] items-end justify-center overflow-hidden rounded-xs py-3 no-underline shadow-tapa transition-transform duration-150 hover:-translate-y-1.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${tela.fondo} ${tela.texto}`}
              >
                <span className="[writing-mode:vertical-rl] whitespace-nowrap rotate-180 text-[11px] font-medium tracking-[0.02em]">
                  {/* El alto del lomo da para unos veintidós caracteres. */}
                  {tituloCorto(entrada.libro.titulo, 22)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
