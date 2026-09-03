import { z } from "zod";
import { registrarLlamado, verificarCupo } from "../lib/consumoGemini.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { generar as generarConIa } from "./gemini.js";
import { cachearLibro, resolverPropuestas } from "./libros.js";

// Se piden un par más de las que se muestran porque algunas se caen al no
// encontrarse en el catálogo. Pedir muchas más era contraproducente: con ocho,
// el volumen de texto hacía que el modelo no terminara ni en dos minutos.
const A_PEDIR = 5;
const A_MOSTRAR = 4;

const SISTEMA = `Sos quien recomienda libros en Queleo, a partir del perfil de lectura de una persona concreta.

Escribís en español rioplatense, con voseo, en un registro sobrio y preciso: nada de exclamaciones, emojis ni entusiasmo de contratapa. Hablás de libros como alguien que los leyó.

Para cada libro que recomendás:
- El razonamiento son una o dos oraciones, apoyadas en algo puntual del perfil o de lo que la persona ya calificó, y lo dice explícitamente. "Porque te gusta la ficción literaria" no sirve; "porque los dos libros de estructura fragmentada que calificaste con 9 comparten este mismo procedimiento" sí.
- El reparo es una oración: el punto donde el libro podría no funcionarle, según su propio patrón. Si no encontrás uno honesto, va en null: no inventes una objeción de compromiso.

Escribís en texto plano: nada de asteriscos, comillas de énfasis ni markdown, porque se muestra tal cual.

Los patrones del lector son exactamente los que figuran en su perfil: no infieras otros ni los presentes como declarados por él. En particular, no deduzcas preferencias de extensión a partir de las páginas de lo que calificó.

Recomendá libros que existan y sean encontrables por título y autor. No recomiendes ninguno que la persona ya tenga en su biblioteca.`;

const esquema = {
  type: "object",
  properties: {
    recomendaciones: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          autor: { type: "string" },
          razonamiento: { type: "string" },
          reparo: { type: "string", nullable: true },
        },
        required: ["titulo", "autor", "razonamiento"],
      },
    },
  },
  required: ["recomendaciones"],
};

const propuestas = z.object({
  recomendaciones: z.array(
    z.object({
      titulo: z.string().min(1),
      autor: z.string().min(1),
      razonamiento: z.string().min(1),
      reparo: z.string().nullable().optional(),
    }),
  ),
});

export async function descartar(usuarioId: string, recomendacionId: string) {
  const { count } = await prisma.recomendacion.updateMany({
    where: { id: recomendacionId, usuarioId, descartadaEn: null },
    data: { descartadaEn: new Date() },
  });

  if (count === 0) {
    throw new AppError(404, "Esa recomendación ya no está.");
  }
}

export function listar(usuarioId: string) {
  return prisma.recomendacion.findMany({
    where: { usuarioId, descartadaEn: null },
    include: { libro: true },
    orderBy: { orden: "asc" },
  });
}

async function contexto(usuarioId: string, descartados: string[] = []) {
  const perfil = await prisma.perfilLector.findUnique({ where: { usuarioId } });
  if (!perfil) {
    throw new AppError(409, "Primero armá tu perfil lector en la sección Perfil.");
  }

  const entradas = await prisma.entradaBiblioteca.findMany({
    where: { usuarioId },
    include: { libro: true },
    orderBy: [{ rating: "desc" }, { actualizadaEn: "desc" }],
    take: 25,
  });

  const yaSugeridos = descartados.map((t) => `- ${t}`).join("\n");

  const biblioteca = entradas
    .map((entrada) => {
      const autores = entrada.libro.autores.join(", ") || "autor desconocido";
      const puntaje = entrada.rating ? ` — ${entrada.rating}/10` : "";
      const resena = entrada.resena ? ` — anotó: "${entrada.resena}"` : "";
      return `- ${entrada.libro.titulo} (${autores})${puntaje}${resena}`;
    })
    .join("\n");

  return `Perfil del lector:
${perfil.resumen}

Géneros: ${perfil.generos.join(", ") || "sin datos"}
Autores afines: ${perfil.autores.join(", ") || "sin datos"}
Patrones: ${perfil.patrones.join(" · ") || "sin datos"}

Ya tiene en su biblioteca (no los recomiendes de nuevo):
${biblioteca || "(biblioteca vacía)"}
${yaSugeridos ? `\nYa se le sugirieron y no le interesaron, no insistas:\n${yaSugeridos}` : ""}
Recomendá ${A_PEDIR} libros.`;
}

export async function regenerar(usuarioId: string) {
  await verificarCupo();

  // Todo lo ya propuesto cuenta como visto, tanto lo que sigue en pantalla
  // como lo que la persona descartó.
  const yaPropuestas = await prisma.recomendacion.findMany({
    where: { usuarioId },
    include: { libro: true },
  });
  const vistos = yaPropuestas.map((r) => `${r.libro.titulo} (${r.libro.autores.join(", ")})`);

  const salida = await generarConIa({
    sistema: SISTEMA,
    turnos: [{ rol: "user", texto: await contexto(usuarioId, vistos) }],
    esquema,
    schema: propuestas,
    // Ocho recomendaciones con su razonamiento son bastante más texto que un
    // turno de entrevista: con 30s se corta antes de que el modelo termine.
    timeoutMs: 120_000,
    fixture: "recomendaciones",
  });
  await registrarLlamado();

  const validas = await resolverPropuestas(salida.recomendaciones, A_MOSTRAR);

  if (validas.length === 0) {
    throw new AppError(502, "No pudimos encontrar los libros sugeridos en el catálogo.");
  }

  const libros = await Promise.all(validas.map(({ libro }) => cachearLibro(libro)));

  await prisma.$transaction([
    prisma.recomendacion.deleteMany({ where: { usuarioId, descartadaEn: null } }),
    prisma.recomendacion.createMany({
      data: validas.map(({ propuesta }, i) => ({
        usuarioId,
        libroId: libros[i].id,
        razonamiento: propuesta.razonamiento,
        reparo: propuesta.reparo ?? null,
        orden: i,
      })),
    }),
  ]);

  return listar(usuarioId);
}
