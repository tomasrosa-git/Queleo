"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSesion } from "./SesionProvider";

const secciones = [
  { label: "Biblioteca", href: "/biblioteca" },
  { label: "Descubrir", href: "/descubrir" },
  { label: "Perfil", href: "/perfil" },
];

export function Nav() {
  const ruta = usePathname();
  const { usuario, cargando, salir } = useSesion();

  return (
    <nav className="mb-12 flex flex-col gap-4 border-b border-linea pb-5 pt-7 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
      <Link href="/" className="text-xl font-bold tracking-tight no-underline">
        Queleo
      </Link>

      <div className="flex items-center gap-4 text-[12px] uppercase tracking-[0.08em] text-piedra sm:gap-7 sm:text-[13px]">
        {secciones.map(({ label, href }) =>
          href ? (
            <Link
              key={label}
              href={href}
              className={`no-underline ${ruta === href ? "text-tinta" : "text-piedra"}`}
            >
              {label}
            </Link>
          ) : (
            <span key={label} className="opacity-40">
              {label}
            </span>
          ),
        )}

        {!cargando &&
          (usuario ? (
            <button
              type="button"
              onClick={salir}
              className="cursor-pointer border-none bg-transparent p-0 text-[12px] uppercase tracking-[0.08em] text-piedra hover:text-guinda sm:text-[13px]"
            >
              Salir
            </button>
          ) : (
            <Link href="/ingresar" className="text-tinta no-underline">
              Ingresar
            </Link>
          ))}
      </div>
    </nav>
  );
}
