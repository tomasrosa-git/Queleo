import type { Libro } from "@/lib/tipos";

// El tamaño llega como clases y no como números para que pueda cambiar por
// breakpoint: la tapa de la ficha se achica en pantallas chicas.
type Props = { libro: Libro; tamano: string };

export function Portada({ libro, tamano }: Props) {
  if (!libro.portadaUrl) {
    return (
      <div className={`shrink-0 rounded-xs border border-linea bg-tarjeta ${tamano}`} />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={libro.portadaUrl}
      alt={`Tapa de ${libro.titulo}`}
      className={`shrink-0 rounded-xs object-cover shadow-[0_1px_2px_rgba(32,30,27,0.08),0_8px_20px_rgba(32,30,27,0.12)] ${tamano}`}
    />
  );
}
