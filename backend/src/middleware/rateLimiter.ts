import type { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler.js";

type Opciones = {
  ventanaMs: number;
  maximo: number;
  mensaje: string;
  clave?: (req: Request) => string;
};

// Límite por usuario en memoria: alcanza porque corre una sola instancia y
// perder el conteo en un reinicio no tiene consecuencias. El techo diario
// global, que sí importa para no quedarse sin cupo, vive en la base.
export function rateLimiter({ ventanaMs, maximo, mensaje, clave }: Opciones) {
  const golpes = new Map<string, number[]>();

  return (req: Request, _res: Response, next: NextFunction) => {
    const id = clave ? clave(req) : (req.userId ?? req.ip ?? "anonimo");
    const ahora = Date.now();
    const recientes = (golpes.get(id) ?? []).filter((t) => ahora - t < ventanaMs);

    if (recientes.length >= maximo) {
      throw new AppError(429, mensaje);
    }

    recientes.push(ahora);
    golpes.set(id, recientes);

    if (golpes.size > 5000) {
      for (const [otro, marcas] of golpes) {
        if (marcas.every((t) => ahora - t >= ventanaMs)) {
          golpes.delete(otro);
        }
      }
    }

    next();
  };
}
