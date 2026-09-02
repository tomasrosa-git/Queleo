import type { z } from "zod";
import { AppError } from "../middleware/errorHandler.js";

const API = "https://generativelanguage.googleapis.com/v1beta/interactions";
const MODELO = process.env.GEMINI_MODELO ?? "gemini-flash-latest";

export type RolGemini = "user" | "model";
export type TurnoGemini = { rol: RolGemini; texto: string };

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
};

export async function generar<T>({ sistema, turnos, esquema, schema }: Pedido<T>): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AppError(503, "Las funciones con IA no están configuradas.");
  }

  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      model: MODELO,
      input: turnos.map(({ rol, texto }) => ({
        role: rol,
        parts: [{ type: "text", text: texto }],
      })),
      system_instruction: sistema,
      store: false,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: esquema,
      },
    }),
  });

  if (res.status === 429) {
    throw new AppError(
      503,
      "Las funciones con IA agotaron su cupo por hoy. Volvé mañana.",
    );
  }
  if (!res.ok) {
    console.error("Gemini respondió", res.status, await res.text());
    throw new AppError(502, "No pudimos consultar a la IA en este momento.");
  }

  return parsearJson(extraerTexto(await res.json()), schema);
}
