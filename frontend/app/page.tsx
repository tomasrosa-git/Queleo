"use client";

import Link from "next/link";
import { useSesion } from "@/components/SesionProvider";

const PASOS = [
  {
    titulo: "Armás tu biblioteca",
    detalle:
      "Buscás lo que leíste, le ponés puntaje y, si querés, anotás qué te pareció.",
  },
  {
    titulo: "Contás cómo leés",
    detalle:
      "Una entrevista corta, en forma de conversación, que deriva tu perfil de lectura.",
  },
  {
    titulo: "Recibís lecturas con su porqué",
    detalle:
      "Cada recomendación viene con el razonamiento detrás, y con el reparo cuando lo hay.",
  },
];

export default function Home() {
  const { usuario, cargando } = useSesion();

  return (
    <main>
      <h1 className="mb-4 mt-2 max-w-[16ch] text-[38px] font-bold leading-[1.1] tracking-tight sm:text-[44px]">
        Leer con alguien que te conoce
      </h1>

      <p className="mb-10 max-w-[54ch] text-[17px] leading-relaxed text-piedra">
        Queleo no te muestra el promedio de otros. Arma tu perfil de lectura y
        sobre eso te dice qué leer, cuánto te va a gustar y por qué — con el
        razonamiento a la vista, para que puedas discutirlo.
      </p>

      {!cargando && (
        <div className="mb-14 flex flex-wrap items-center gap-5">
          <Link
            href={usuario ? "/descubrir" : "/registro"}
            className="rounded-xs bg-guinda px-5 py-3 text-[13px] font-medium text-papel no-underline hover:bg-guinda-hover"
          >
            {usuario ? "Ver mis recomendaciones" : "Empezar"}
          </Link>

          {!usuario && (
            <Link href="/ingresar" className="text-[13px] text-piedra underline hover:text-guinda">
              Ya tengo cuenta
            </Link>
          )}
        </div>
      )}

      <ol className="m-0 list-none border-t border-linea p-0">
        {PASOS.map((paso, i) => (
          <li key={paso.titulo} className="flex gap-5 border-b border-linea py-5">
            <span className="text-[15px] font-bold tabular-nums text-guinda">
              {i + 1}
            </span>
            <div>
              <p className="m-0 text-[15px] font-medium">{paso.titulo}</p>
              <p className="mb-0 mt-1 max-w-[54ch] text-[15px] leading-relaxed text-piedra">
                {paso.detalle}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
