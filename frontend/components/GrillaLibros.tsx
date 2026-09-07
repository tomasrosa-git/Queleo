import Link from "next/link";
import { Portada } from "@/components/Portada";
import type { Libro } from "@/lib/tipos";

export type ItemGrilla = {
  clave: string;
  libro: Libro;
  // Se dibuja sobre la tapa: el puntaje propio en la biblioteca, la predicción
  // en las recomendaciones. Sin valor, la tapa va limpia.
  marca?: string | null;
};

export function GrillaLibros({ items }: { items: ItemGrilla[] }) {
  return (
    <ul className="m-0 grid list-none grid-cols-3 gap-x-5 gap-y-8 p-0 sm:grid-cols-4 sm:gap-x-6">
      {items.map(({ clave, libro, marca }) => (
        <li key={clave}>
          <Link
            href={`/libro/${libro.googleBooksId}`}
            className="group block no-underline"
          >
            <div className="relative mb-2.5">
              <Portada
                libro={libro}
                tamano="aspect-[2/3] w-full transition-transform duration-150 group-hover:-translate-y-1 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
              />

              {marca && (
                <span className="absolute -bottom-1.5 -right-1.5 flex h-7 min-w-7 items-center justify-center rounded-xs bg-guinda px-1.5 text-[12px] font-bold tabular-nums text-papel shadow-tapa">
                  {marca}
                </span>
              )}
            </div>

            {/* Los títulos de Google Books traen la edición pegada con dos
                puntos y se van a tres o cuatro líneas, que desalinean la fila
                entera: se cortan en dos. */}
            <p className="m-0 line-clamp-2 font-serif text-[14px] font-semibold leading-snug text-tinta">
              {libro.titulo}
            </p>
            <p className="m-0 mt-0.5 line-clamp-1 text-[12px] leading-snug text-piedra">
              {libro.autores[0] ?? "Autor desconocido"}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
