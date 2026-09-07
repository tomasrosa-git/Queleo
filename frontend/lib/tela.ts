// Los colores de tela de tapa dura del mockup. Se eligen por el título para
// que un libro conserve siempre el mismo color entre visitas y entre vistas:
// el lomo del estante y la tapa generada de la grilla son del mismo color.
const TELAS = [
  { fondo: "bg-guinda", texto: "text-[#F2DEDD]", tenue: "text-[#F2DEDD]/70" },
  { fondo: "bg-verde", texto: "text-[#DCE6DE]", tenue: "text-[#DCE6DE]/70" },
  { fondo: "bg-tinta", texto: "text-[#D9D5CB]", tenue: "text-[#D9D5CB]/70" },
  { fondo: "bg-[#A8874A]", texto: "text-[#2C2213]", tenue: "text-[#2C2213]/70" },
  // Con la piedra oscurecida por contraste, el texto de este lomo pasó a ser
  // claro: en oscuro ya no se leía.
  { fondo: "bg-piedra", texto: "text-[#F1EEE8]", tenue: "text-[#F1EEE8]/75" },
];

export function telaDe(titulo: string) {
  const suma = [...titulo].reduce((total, letra) => total + letra.charCodeAt(0), 0);
  return TELAS[suma % TELAS.length];
}

// En una tapa entra el título, no la edición: se corta el subtítulo que Google
// Books pega con dos puntos.
export function tituloCorto(titulo: string, maximo: number) {
  const base = titulo.split(":")[0].trim();
  return base.length > maximo ? `${base.slice(0, maximo - 1)}…` : base;
}
