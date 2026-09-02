import { Router } from "express";
import { z } from "zod";
import { parsear } from "../lib/validacion.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as biblioteca from "../servicios/biblioteca.js";

export const bibliotecaRouter = Router();

const estados = ["QUIERO_LEER", "LEYENDO", "LEIDO"] as const;

const entradaSchema = z.object({
  estado: z.enum(estados, { message: "Estado de lectura inválido" }),
  rating: z
    .number()
    .int("El puntaje tiene que ser un número entero")
    .min(1, "El puntaje va de 1 a 10")
    .max(10, "El puntaje va de 1 a 10")
    .nullable()
    .optional(),
  resena: z.string().trim().max(4000, "La reseña es demasiado larga").nullable().optional(),
});

const filtroSchema = z
  .enum(estados, { message: "Estado de lectura inválido" })
  .optional();

bibliotecaRouter.get("/biblioteca", requireAuth, async (req, res) => {
  const estado = parsear(filtroSchema, req.query.estado || undefined);

  res.json({ entradas: await biblioteca.listar(req.userId!, estado) });
});

bibliotecaRouter.get("/biblioteca/:googleBooksId", requireAuth, async (req, res) => {
  const entrada = await biblioteca.porLibro(
    req.userId!,
    String(req.params.googleBooksId),
  );

  res.json({ entrada });
});

bibliotecaRouter.put("/biblioteca/:googleBooksId", requireAuth, async (req, res) => {
  const datos = parsear(entradaSchema, req.body);
  const entrada = await biblioteca.guardar(
    req.userId!,
    String(req.params.googleBooksId),
    datos,
  );

  res.json({ entrada });
});

bibliotecaRouter.delete("/biblioteca/:googleBooksId", requireAuth, async (req, res) => {
  await biblioteca.eliminar(req.userId!, String(req.params.googleBooksId));

  res.status(204).end();
});
