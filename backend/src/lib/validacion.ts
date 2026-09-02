import type { z } from "zod";
import { AppError } from "../middleware/errorHandler.js";

export function parsear<T>(schema: z.ZodType<T>, valor: unknown): T {
  const resultado = schema.safeParse(valor);
  if (!resultado.success) {
    throw new AppError(400, resultado.error.issues[0].message);
  }
  return resultado.data;
}
