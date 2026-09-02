const secciones = ["Biblioteca", "Descubrir", "Perfil"];

export function Nav() {
  return (
    <nav className="mb-12 flex items-center justify-between border-b border-linea pb-5 pt-7">
      <span className="text-xl font-bold tracking-tight">Queleo</span>
      <div className="flex gap-7 text-[13px] uppercase tracking-[0.08em] text-piedra">
        {secciones.map((seccion) => (
          <span key={seccion}>{seccion}</span>
        ))}
      </div>
    </nav>
  );
}
