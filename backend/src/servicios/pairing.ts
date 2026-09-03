import { z } from "zod";
import { registrarLlamado, verificarCupo } from "../lib/consumoGemini.js";
import { prisma } from "../lib/prisma.js";
import { generar } from "./gemini.js";
import { cachearLibro, resolverPropuestas } from "./libros.js";

const A_PEDIR = 5;
const A_MOSTRAR = 4;

const SISTEMA = `Alguien te cuenta con sus palabras qué tiene ganas de leer y vos le proponés libros que peguen con ese pedido.

Escribís en español rioplatense, con voseo, en un registro sobrio y preciso: sin exclamaciones, emojis ni entusiasmo de contratapa. Escribís en texto plano, sin markdown.

El pedido puede ser un estado de ánimo ("algo liviano"), una referencia a otra cosa que vio o leyó ("la vibra de Severance"), o una situación ("algo para un viaje largo"). Interpretalo como lo haría un librero: lo que importa es qué forma narrativa está buscando, no la referencia literal. Si menciona una serie o película, tomá de ahí el tono, el tema o el procedimiento, y proponé libros — nunca otras series ni películas.

Antes de proponer nada, decí en una oración qué forma narrativa entendés que está buscando: no repitas sus palabras ni parafrasees el pedido, traducilo a lo que en un libro significa. Si pidió "la vibra de Severance", eso puede ser "narraciones sobre instituciones que administran la identidad de sus miembros", no "algo parecido a Severance".

Para cada libro, el vínculo explica en una o dos oraciones qué tiene que ver con lo que pidió. Si el perfil del lector aporta algo, usalo; si el pedido va en contra de su gusto habitual, respetá el pedido: hoy quiere otra cosa.

Proponé libros que existan y sean encontrables por título y autor, y ninguno de los que ya tiene en su biblioteca.`;

const esquema = {
  type: "object",
  properties: {
    lectura: { type: "string" },
    sugerencias: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          autor: { type: "string" },
          vinculo: { type: "string" },
        },
        required: ["titulo", "autor", "vinculo"],
      },
    },
  },
  required: ["lectura", "sugerencias"],
};

const salida = z.object({
  // Cómo tradujo el pedido a una forma narrativa: se muestra para que se vea
  // que lo interpretó y no que hizo una búsqueda literal.
  lectura: z.string().min(1),
  sugerencias: z.array(
    z.object({
      titulo: z.string().min(1),
      autor: z.string().min(1),
      vinculo: z.string().min(1),
    }),
  ),
});

async function contexto(usuarioId: string) {
  const [perfil, entradas] = await Promise.all([
    prisma.perfilLector.findUnique({ where: { usuarioId } }),
    prisma.entradaBiblioteca.findMany({
      where: { usuarioId },
      include: { libro: { select: { titulo: true, autores: true } } },
      take: 40,
    }),
  ]);

  const descripcion = perfil
    ? `${perfil.resumen}\nGéneros: ${perfil.generos.join(", ")}\nAutores afines: ${perfil.autores.join(", ")}`
    : "(el lector todavía no armó su perfil)";

  // Sin esto vuelve a sugerir libros que la persona ya tiene.
  const yaTiene = entradas
    .map((e) => `${e.libro.titulo} (${e.libro.autores.join(", ")})`)
    .join("; ");

  return `${descripcion}\n\nYa tiene en su biblioteca, no los propongas: ${yaTiene || "(nada todavía)"}`;
}

export async function emparejar(usuarioId: string, consulta: string) {
  await verificarCupo();

  const respuesta = await generar({
    sistema: SISTEMA,
    turnos: [
      {
        rol: "user",
        texto: `Perfil del lector:\n${await contexto(usuarioId)}\n\nPedido: "${consulta}"\n\nProponé ${A_PEDIR} libros.`,
      },
    ],
    esquema,
    schema: salida,
    timeoutMs: 120_000,
    fixture: "pairing",
  });
  await registrarLlamado();

  const halladas = await resolverPropuestas(respuesta.sugerencias, A_MOSTRAR);

  // El pedido es puntual y no se guarda, pero los libros que aparecen sí se
  // cachean: es probable que el lector abra alguno.
  const libros = await Promise.all(halladas.map(({ libro }) => cachearLibro(libro)));

  return {
    lectura: respuesta.lectura,
    sugerencias: halladas.map(({ propuesta }, i) => ({
      libro: libros[i],
      vinculo: propuesta.vinculo,
    })),
  };
}
