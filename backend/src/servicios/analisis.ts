import { z } from "zod";
import { registrarLlamado, verificarCupo } from "../lib/consumoGemini.js";
import { prisma } from "../lib/prisma.js";
import { generar } from "./gemini.js";
import { asegurarLibro } from "./libros.js";

const LIBROS_EN_CONTEXTO = 15;

const SISTEMA = `Analizás un libro para un lector concreto de Queleo, a partir de su perfil de lectura y de lo que ya calificó.

Escribís en español rioplatense, con voseo, en un registro sobrio y preciso: sin exclamaciones, emojis ni entusiasmo de contratapa.

- La sinopsis son dos o tres oraciones sobre de qué va el libro, sin spoilers del desenlace y sin juicios de valor.
- La predicción es el puntaje del 1 al 10 que probablemente le pondría esta persona, no el que merece el libro. Puede tener un decimal.
- El razonamiento explica esa predicción apoyándose en algo puntual del perfil o de los libros que calificó, y lo dice explícitamente. Si la predicción es alta por un motivo y baja por otro, decí las dos cosas.

Escribís en texto plano: nada de asteriscos, comillas de énfasis ni markdown, porque se muestra tal cual.

Los patrones del lector son exactamente los que figuran en su perfil: no infieras otros ni los presentes como declarados por él. En particular, no deduzcas preferencias de extensión a partir de la cantidad de páginas de los libros que calificó — que haya puntuado alto un libro de 300 páginas no significa que prefiera esa extensión. Si querés mencionar el largo, decilo como observación tuya sobre el libro, nunca como una preferencia suya.`;

const esquema = {
  type: "object",
  properties: {
    sinopsis: { type: "string" },
    prediccion: { type: "number" },
    razonamiento: { type: "string" },
  },
  required: ["sinopsis", "prediccion", "razonamiento"],
};

const salidaAnalisis = z.object({
  sinopsis: z.string().min(1),
  prediccion: z.number().min(1).max(10),
  razonamiento: z.string().min(1),
});

export function analisisDe(usuarioId: string, libroId: string) {
  return prisma.analisisLibro.findUnique({
    where: { usuarioId_libroId: { usuarioId, libroId } },
  });
}

async function contexto(usuarioId: string) {
  const [perfil, entradas] = await Promise.all([
    prisma.perfilLector.findUnique({ where: { usuarioId } }),
    prisma.entradaBiblioteca.findMany({
      where: { usuarioId, rating: { not: null } },
      include: { libro: true },
      orderBy: [{ rating: "desc" }, { actualizadaEn: "desc" }],
      take: LIBROS_EN_CONTEXTO,
    }),
  ]);

  const calificados = entradas
    .map((entrada) => {
      const autores = entrada.libro.autores.join(", ") || "autor desconocido";
      const resena = entrada.resena ? ` — anotó: "${entrada.resena}"` : "";
      return `- ${entrada.libro.titulo} (${autores}) — ${entrada.rating}/10${resena}`;
    })
    .join("\n");

  const descripcionPerfil = perfil
    ? `${perfil.resumen}\n\nGéneros: ${perfil.generos.join(", ")}\nAutores afines: ${perfil.autores.join(", ")}\nPatrones: ${perfil.patrones.join(" · ")}`
    : "(todavía no armó su perfil lector)";

  return { descripcionPerfil, calificados };
}

export async function analizar(usuarioId: string, googleBooksId: string) {
  const libro = await asegurarLibro(googleBooksId);
  await verificarCupo();

  const { descripcionPerfil, calificados } = await contexto(usuarioId);
  const ficha = [
    `Título: ${libro.titulo}`,
    `Autor: ${libro.autores.join(", ") || "desconocido"}`,
    libro.anioPublicacion && `Año: ${libro.anioPublicacion}`,
    libro.paginas && `Páginas: ${libro.paginas}`,
  ]
    .filter(Boolean)
    .join("\n");

  const salida = await generar({
    sistema: SISTEMA,
    turnos: [
      {
        rol: "user",
        texto: `Perfil del lector:\n${descripcionPerfil}\n\nLibros que calificó:\n${
          calificados || "(todavía no calificó ninguno)"
        }\n\nLibro a analizar:\n${ficha}`,
      },
    ],
    esquema,
    schema: salidaAnalisis,
    // Sinopsis + razonamiento pasan los 30s del margen por defecto.
    timeoutMs: 90_000,
    fixture: "analisis",
  });
  await registrarLlamado();

  return prisma.analisisLibro.upsert({
    where: { usuarioId_libroId: { usuarioId, libroId: libro.id } },
    create: { usuarioId, libroId: libro.id, ...salida },
    update: salida,
  });
}
