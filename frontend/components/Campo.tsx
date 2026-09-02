type Props = {
  etiqueta: string;
  tipo?: string;
  valor: string;
  onChange: (valor: string) => void;
  autoComplete?: string;
};

export function Campo({ etiqueta, tipo = "text", valor, onChange, autoComplete }: Props) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.08em] text-piedra">
        {etiqueta}
      </span>
      <input
        type={tipo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        className="w-full rounded-xs border border-linea bg-tarjeta px-3 py-2.5 text-[15px] text-tinta outline-none focus:border-tinta"
      />
    </label>
  );
}
