import { z } from "zod";
import { registrarLlamado, verificarCupo } from "../lib/consumoGemini.js";
import { prisma } from "../lib/prisma.js";
import { generar, type TurnoGemini } from "./gemini.js";

// El contexto que viaja a la IA se acota a propósito: los libros mejor
// calificados alcanzan para derivar el gusto y evitan prompts gigantes.
const LIBROS_EN_CONTEXTO = 20;
const TURNOS_EN_CONTEXTO = 40;

export const SALUDO_INICIAL =
  "Contame qué estuviste leyendo últimamente, o qué libro te dejó pensando " +
  "más tiempo del que esperabas. No hace falta que sea reciente.";

const TONO =
  "Escribís en español rioplatense, en segunda persona del singular con voseo. " +
  "Tu registro es sobrio y preciso, nunca efusivo ni publicitario: no usás " +
  "signos de exclamación, emojis ni elogios vacíos. Hablás de libros como " +
  "alguien que los leyó, no como una contratapa.";

const SISTEMA_ONBOARDING = `Sos el entrevistador de Queleo, una plataforma que arma el perfil de un lector para recomendarle libros.

${TONO}

Tu trabajo es entrevistar al lector con una sola pregunta por turno, breve, que profundice sobre lo que acaba de contar. Buscás entender qué formas narrativas le funcionan y cuáles no: ritmo, extensión, estructura, densidad de prosa, temas, finales.

No recomiendes libros todavía y no resumas lo que el lector dijo. Marcá "suficiente" en true recién cuando tengas material para describir su gusto con precisión, lo que normalmente lleva al menos cuatro o cinco intercambios.`;

const SISTEMA_PERFIL = `Sos el analista de Queleo. A partir de una conversación con un lector y de los libros que calificó, escribís su perfil de lectura.

${TONO}

El resumen son dos o tres oraciones que describen el gusto del lector con precisión, mencionando tensiones o contradicciones si las hay. Los géneros y autores salen de lo que el lector mostró, no de lo que se supone que debería gustarle. Los patrones son observaciones concretas y accionables sobre su forma de leer, del tipo "puntúa más alto los libros de menos de 300 páginas" o "abandona las sagas largas".

No inventes datos que la conversación no respalde.`;

const respuestaOnboarding = z.object({
  respuesta: z.string().min(1),
  suficiente: z.boolean(),
});

const esquemaOnboarding = {
  type: "object",
  properties: {
    respuesta: { type: "string" },
    suficiente: { type: "boolean" },
  },
  required: ["respuesta", "suficiente"],
};

const perfilDerivado = z.object({
  resumen: z.string().min(1),
  generos: z.array(z.string()),
  autores: z.array(z.string()),
  patrones: z.array(z.string()),
});

const esquemaPerfil = {
  type: "object",
  properties: {
    resumen: { type: "string" },
    generos: { type: "array", items: { type: "string" } },
    autores: { type: "array", items: { type: "string" } },
    patrones: { type: "array", items: { type: "string" } },
  },
  required: ["resumen", "generos", "autores", "patrones"],
};

export async function contextoBiblioteca(usuarioId: string) {
  const entradas = await prisma.entradaBiblioteca.findMany({
    where: { usuarioId, estado: { in: ["LEIDO", "LEYENDO"] } },
    include: { libro: true },
    orderBy: [{ rating: "desc" }, { actualizadaEn: "desc" }],
    take: LIBROS_EN_CONTEXTO,
  });

  if (entradas.length === 0) {
    return "El lector todavía no calificó ningún libro en su biblioteca.";
  }

  const lineas = entradas.map((entrada) => {
    const autores = entrada.libro.autores.join(", ") || "autor desconocido";
    const puntaje = entrada.rating ? ` — ${entrada.rating}/10` : "";
    const resena = entrada.resena ? ` — anotó: "${entrada.resena}"` : "";
    const paginas = entrada.libro.paginas ? `, ${entrada.libro.paginas} págs` : "";

    return `- ${entrada.libro.titulo} (${autores}${paginas})${puntaje}${resena}`;
  });

  return `Libros en la biblioteca del lector:\n${lineas.join("\n")}`;
}

export function historial(usuarioId: string) {
  return prisma.mensajeOnboarding.findMany({
    where: { usuarioId },
    orderBy: { creadoEn: "asc" },
    take: TURNOS_EN_CONTEXTO,
  });
}

export function perfilDe(usuarioId: string) {
  return prisma.perfilLector.findUnique({ where: { usuarioId } });
}

export async function responder(usuarioId: string, mensaje: string) {
  await verificarCupo();

  const previos = await historial(usuarioId);
  const turnos: TurnoGemini[] = [
    { rol: "user", texto: await contextoBiblioteca(usuarioId) },
    ...previos.map((m) => ({
      rol: m.rol === "USUARIO" ? ("user" as const) : ("model" as const),
      texto: m.contenido,
    })),
    { rol: "user", texto: mensaje },
  ];

  const salida = await generar({
    sistema: SISTEMA_ONBOARDING,
    turnos,
    esquema: esquemaOnboarding,
    schema: respuestaOnboarding,
  });

  await registrarLlamado();
  await prisma.mensajeOnboarding.createMany({
    data: [
      { usuarioId, rol: "USUARIO", contenido: mensaje },
      { usuarioId, rol: "ASISTENTE", contenido: salida.respuesta },
    ],
  });

  return salida;
}

export async function derivar(usuarioId: string) {
  await verificarCupo();

  const previos = await historial(usuarioId);
  const conversacion = previos
    .map((m) => `${m.rol === "USUARIO" ? "Lector" : "Entrevistador"}: ${m.contenido}`)
    .join("\n");

  const salida = await generar({
    sistema: SISTEMA_PERFIL,
    turnos: [
      {
        rol: "user",
        texto: `${await contextoBiblioteca(usuarioId)}\n\nConversación:\n${
          conversacion || "(sin conversación previa)"
        }`,
      },
    ],
    esquema: esquemaPerfil,
    schema: perfilDerivado,
  });

  await registrarLlamado();

  return prisma.perfilLector.upsert({
    where: { usuarioId },
    create: { usuarioId, ...salida },
    update: salida,
  });
}

export async function reiniciar(usuarioId: string) {
  await prisma.mensajeOnboarding.deleteMany({ where: { usuarioId } });
}
