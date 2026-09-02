import type { Libro } from "@/lib/tipos";

type Props = { libro: Libro; ancho: number; alto: number };

export function Portada({ libro, ancho, alto }: Props) {
  const estilo = { width: ancho, height: alto };

  if (!libro.portadaUrl) {
    return (
      <div
        style={estilo}
        className="shrink-0 rounded-xs border border-linea bg-tarjeta"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={libro.portadaUrl}
      alt={`Tapa de ${libro.titulo}`}
      style={estilo}
      className="shrink-0 rounded-xs object-cover shadow-[0_1px_2px_rgba(32,30,27,0.08),0_8px_20px_rgba(32,30,27,0.12)]"
    />
  );
}
