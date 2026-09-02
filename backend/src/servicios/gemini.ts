import type { z } from "zod";
import { AppError } from "../middleware/errorHandler.js";

const API = "https://generativelanguage.googleapis.com/v1beta/interactions";
// "gemini-flash-latest" apunta hoy a 3.7-flash, el modelo más nuevo y el más
// congestionado en el free tier (confirmado en vivo: 500 "high demand" y
// cuelgues sin respuesta). La propia API, al pedirle 2.5-flash, recomendó
// 3.6-flash para cuentas nuevas — se fija ese en vez del alias "latest".
const MODELO = process.env.GEMINI_MODELO ?? "gemini-3.6-flash";
// Una respuesta corta (un turno de entrevista) vuelve en 8-15s, pero pedir
// varias recomendaciones con su razonamiento genera mucho más texto y pasa
// los 30s con facilidad: cada llamador fija su propio margen.
const TIMEOUT_POR_DEFECTO_MS = 30_000;

export type RolGemini = "user" | "model";
export type TurnoGemini = { rol: RolGemini; texto: string };

// La API espera el historial como "steps" con la misma forma que devuelve en
// la respuesta (type: user_input/model_output + content), no como {role,
// parts}: eso da 400 "Unknown parameter 'parts'". Confirmado contra la API real.
function comoStep({ rol, texto }: TurnoGemini) {
  return {
    type: rol === "user" ? "user_input" : "model_output",
    content: [{ type: "text", text: texto }],
  };
}

type Respuesta = {
  status?: string;
  steps?: {
    type?: string;
    content?: { type?: string; text?: string }[];
  }[];
};

export function extraerTexto(respuesta: Respuesta): string {
  const texto = (respuesta.steps ?? [])
    .filter((paso) => paso.type === "model_output")
    .flatMap((paso) => paso.content ?? [])
    .filter((parte) => parte.type === "text")
    .map((parte) => parte.text ?? "")
    .join("")
    .trim();

  if (!texto) {
    throw new AppError(502, "La IA respondió vacío. Probá de nuevo.");
  }

  return texto;
}

// Aun pidiendo mime_type JSON, el modelo a veces devuelve el objeto envuelto
// en un bloque de código markdown.
export function limpiarCerca(texto: string): string {
  const cerca = texto.match(/^```(?:json)?\s*\n([\s\S]*?)\n?```$/);
  return (cerca ? cerca[1] : texto).trim();
}

export function parsearJson<T>(texto: string, schema: z.ZodType<T>): T {
  let crudo: unknown;
  try {
    crudo = JSON.parse(limpiarCerca(texto));
  } catch {
    throw new AppError(502, "La IA devolvió una respuesta que no pudimos leer.");
  }

  const resultado = schema.safeParse(crudo);
  if (!resultado.success) {
    throw new AppError(502, "La IA devolvió una respuesta incompleta.");
  }

  return resultado.data;
}

type Pedido<T> = {
  sistema: string;
  turnos: TurnoGemini[];
  esquema: Record<string, unknown>;
  schema: z.ZodType<T>;
  timeoutMs?: number;
};

const MENSAJE_SATURADO =
  "Las funciones con IA están saturadas o sin cupo por ahora. Probá de nuevo en un minuto.";

async function llamar(
  sistema: string,
  turnos: TurnoGemini[],
  esquema: Record<string, unknown>,
  timeoutMs: number,
) {
  const apiKey = process.env.GEMINI_API_KEY!;

  return fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      model: MODELO,
      input: turnos.map(comoStep),
      system_instruction: sistema,
      store: false,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: esquema,
      },
    }),
  });
}

// El free tier devuelve 429 (cupo) o 500 (demanda alta del modelo,
// "usually temporary" según el propio mensaje de Google) con frecuencia
// real, no sólo en el peor caso — confirmado con la API en vivo. Un reintento
// después de una pausa corta resuelve la mayoría sin que el usuario lo note.
// Un timeout no se reintenta: ya se esperó el margen completo y repetirlo
// duplicaría la espera del usuario para el mismo resultado.
export async function generar<T>({
  sistema,
  turnos,
  esquema,
  schema,
  timeoutMs = TIMEOUT_POR_DEFECTO_MS,
}: Pedido<T>): Promise<T> {
  if (!process.env.GEMINI_API_KEY) {
    throw new AppError(503, "Las funciones con IA no están configuradas.");
  }

  let res: Response;
  try {
    res = await llamar(sistema, turnos, esquema, timeoutMs);
  } catch (err) {
    console.error("Gemini no respondió a tiempo", err);
    throw new AppError(503, MENSAJE_SATURADO);
  }

  // Un 5xx es demanda momentánea y suele pasar en segundos. Un 429 es cuota
  // por minuto — Google pide esperar ~20s, así que reintentar acá sólo haría
  // esperar al usuario para fallar igual.
  if (res.status >= 500) {
    console.error("Gemini respondió", res.status, "— reintentando");
    await new Promise((r) => setTimeout(r, 3000));
    try {
      res = await llamar(sistema, turnos, esquema, timeoutMs);
    } catch (err) {
      console.error("Gemini no respondió a tiempo en el reintento", err);
      throw new AppError(503, MENSAJE_SATURADO);
    }
  }

  if (res.status === 429 || res.status >= 500) {
    console.error("Gemini saturado", res.status, (await res.text()).slice(0, 300));
    throw new AppError(503, MENSAJE_SATURADO);
  }
  if (!res.ok) {
    console.error("Gemini respondió", res.status, await res.text());
    throw new AppError(502, "No pudimos consultar a la IA en este momento.");
  }

  return parsearJson(extraerTexto(await res.json()), schema);
}
