"use client";

import Link from "next/link";
import { useSesion } from "@/components/SesionProvider";
import { telaDe } from "@/lib/tela";

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

// La página explicaba el producto sin mostrarlo nunca. Esta es una
// recomendación con la forma exacta que tienen las reales — predicción,
// razonamiento y reparo — rotulada como ejemplo para no hacerla pasar por
// una salida del modelo.
const EJEMPLO = {
  titulo: "Los detectives salvajes",
  autor: "Roberto Bolaño",
  prediccion: "8.4",
  razonamiento:
    "Los dos libros de estructura fragmentada que calificaste con 9 comparten el mismo procedimiento: una novela que se cuenta por voces sueltas y deja que el lector arme el centro.",
  reparo:
    "La segunda parte son cuatrocientas páginas de testimonios sin trama, y tus notas dicen que abandonás cuando se diluye el hilo.",
};

export default function Home() {
  const { usuario, cargando } = useSesion();
  const tela = telaDe(EJEMPLO.titulo);

  return (
    <main>
      <h1 className="mb-4 mt-2 max-w-[16ch] font-serif text-[40px] font-bold leading-[1.08] tracking-tight sm:text-[48px]">
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

      <section className="mb-14">
        <p className="mb-4 text-[11px] uppercase tracking-[0.1em] text-piedra">
          Así se ve una recomendación
        </p>

        <div className="flex flex-col gap-6 border-t border-linea pt-7 sm:flex-row sm:gap-7">
          <div
            className={`flex h-[210px] w-[140px] shrink-0 flex-col justify-between rounded-xs p-4 shadow-tapa ${tela.fondo}`}
          >
            <span className={`font-serif text-[16px] font-semibold leading-snug ${tela.texto}`}>
              {EJEMPLO.titulo}
            </span>
            <span className={`text-[10px] uppercase leading-relaxed tracking-[0.08em] ${tela.tenue}`}>
              {EJEMPLO.autor}
            </span>
          </div>

          <div className="min-w-0">
            <div className="mb-3.5 flex items-baseline gap-2.5">
              <span className="font-serif text-[30px] font-bold leading-none tabular-nums text-guinda">
                {EJEMPLO.prediccion}
              </span>
              <span className="text-[11px] uppercase tracking-[0.1em] text-piedra">
                te va a gustar
              </span>
            </div>

            <p className="m-0 max-w-[52ch] font-serif text-[16px] leading-relaxed">
              {EJEMPLO.razonamiento}
            </p>
            <p className="mb-0 mt-3 max-w-[52ch] border-l-2 border-linea pl-3.5 font-serif text-[15px] leading-relaxed text-piedra">
              {EJEMPLO.reparo}
            </p>
          </div>
        </div>
      </section>

      <ol className="m-0 list-none border-t border-linea p-0">
        {PASOS.map((paso, i) => (
          <li key={paso.titulo} className="flex gap-5 border-b border-linea py-5">
            <span className="font-serif text-[15px] font-bold tabular-nums text-guinda">
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
