import { telaDe, tituloCorto } from "@/lib/tela";
import type { Libro } from "@/lib/tipos";

// El tamaño llega como clases y no como números para que pueda cambiar por
// breakpoint: la tapa de la ficha se achica en pantallas chicas.
type Props = { libro: Libro; tamano: string };

export function Portada({ libro, tamano }: Props) {
  // Google Books no tiene tapa para una parte del catálogo. Un rectángulo
  // vacío deja agujeros en la grilla, así que se compone una tapa con el
  // título — que es, al fin y al cabo, lo que lleva impreso una tapa.
  if (!libro.portadaUrl) {
    const tela = telaDe(libro.titulo);

    return (
      <div
        className={`flex shrink-0 flex-col justify-between overflow-hidden rounded-xs p-[8%] shadow-tapa ${tela.fondo} ${tamano}`}
      >
        <span
          className={`font-serif text-[max(11px,min(1.1em,15px))] font-semibold leading-tight ${tela.texto}`}
        >
          {tituloCorto(libro.titulo, 60)}
        </span>
        <span className={`text-[10px] uppercase tracking-[0.08em] ${tela.tenue}`}>
          {libro.autores[0] ?? ""}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={libro.portadaUrl}
      alt={`Tapa de ${libro.titulo}`}
      className={`shrink-0 rounded-xs bg-tarjeta object-cover shadow-tapa ${tamano}`}
    />
  );
}
