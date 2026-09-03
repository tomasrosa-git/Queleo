import { Router } from "express";
import { z } from "zod";
import { parsear } from "../lib/validacion.js";
import { rateLimiter } from "../middleware/rateLimiter.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as pairing from "../servicios/pairing.js";

export const pairingRouter = Router();

const limiteIa = rateLimiter({
  ventanaMs: 5 * 60 * 1000,
  maximo: 6,
  mensaje: "Esperá unos minutos antes de pedir otra búsqueda.",
});

const consultaSchema = z.object({
  consulta: z
    .string()
    .trim()
    .min(3, "Contame un poco más de lo que buscás")
    .max(500, "El pedido es demasiado largo"),
});

pairingRouter.post("/pairing", requireAuth, limiteIa, async (req, res) => {
  const { consulta } = parsear(consultaSchema, req.body);

  res.json(await pairing.emparejar(req.userId!, consulta));
});
