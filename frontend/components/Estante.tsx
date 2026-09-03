import Link from "next/link";
import type { EntradaBiblioteca } from "@/lib/tipos";

// Los colores de tela de tapa dura del mockup. Se asignan por el título para
// que un libro conserve siempre el mismo lomo entre visitas.
const LOMOS = [
  "bg-guinda text-[#F2DEDD]",
  "bg-verde text-[#DCE6DE]",
  "bg-tinta text-[#D9D5CB]",
  "bg-[#A8874A] text-[#2C2213]",
  "bg-piedra text-[#2C2A26]",
];

// En un lomo real entra el título, no la edición: se corta el subtítulo que
// Google Books pega con dos puntos y se acota el largo.
function tituloDeLomo(titulo: string) {
  // El alto del lomo da para unos veintidós caracteres a este cuerpo.
  const base = titulo.split(":")[0].trim();
  return base.length > 22 ? `${base.slice(0, 21)}…` : base;
}

function lomoDe(titulo: string) {
  const suma = [...titulo].reduce((total, letra) => total + letra.charCodeAt(0), 0);
  return LOMOS[suma % LOMOS.length];
}

export function Estante({ entradas }: { entradas: EntradaBiblioteca[] }) {
  if (entradas.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <p className="mb-4 text-[13px] uppercase tracking-[0.06em] text-piedra">
        Tu estante
      </p>

      <ul className="m-0 flex list-none gap-2 p-0">
        {entradas.map((entrada) => (
          <li key={entrada.id} className="flex-1">
            <Link
              href={`/libro/${entrada.libro.googleBooksId}`}
              title={`${entrada.libro.titulo} — ${entrada.rating}/10`}
              className={`flex h-[148px] items-end justify-center overflow-hidden rounded-xs py-3 no-underline transition-transform duration-150 hover:-translate-y-1.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${lomoDe(entrada.libro.titulo)}`}
            >
              <span className="[writing-mode:vertical-rl] whitespace-nowrap rotate-180 text-[11px] font-medium tracking-[0.02em]">
                {tituloDeLomo(entrada.libro.titulo)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
