import { Router } from "express";
import { rateLimiter } from "../middleware/rateLimiter.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as recomendaciones from "../servicios/recomendaciones.js";

export const recomendacionesRouter = Router();

const limiteIa = rateLimiter({
  ventanaMs: 5 * 60 * 1000,
  maximo: 4,
  mensaje: "Esperá unos minutos antes de pedir recomendaciones nuevas.",
});

recomendacionesRouter.get("/recomendaciones", requireAuth, async (req, res) => {
  res.json({ recomendaciones: await recomendaciones.listar(req.userId!) });
});

recomendacionesRouter.post("/recomendaciones", requireAuth, limiteIa, async (req, res) => {
  res.json({ recomendaciones: await recomendaciones.regenerar(req.userId!) });
});

// Descartar no llama a la IA: sólo saca esa de la lista. La próxima tanda
// tiene en cuenta lo descartado para no volver a proponerlo.
recomendacionesRouter.delete("/recomendaciones/:id", requireAuth, async (req, res) => {
  await recomendaciones.descartar(req.userId!, String(req.params.id));

  res.status(204).end();
});
