type Props = {
  titulo: string;
  children: React.ReactNode;
  fuente?: string;
};

// El colofón es el bloque donde vive el razonamiento de la IA, con el mismo
// rol que la nota de edición al final de un libro.
export function Colofon({ titulo, children, fuente }: Props) {
  return (
    <section className="mb-12 border-y border-linea py-[22px]">
      <p className="mb-2.5 text-[11px] uppercase tracking-[0.1em] text-piedra">
        {titulo}
      </p>
      {children}
      {fuente && (
        <p className="mt-2.5 text-[11px] tabular-nums text-piedra">{fuente}</p>
      )}
    </section>
  );
}
