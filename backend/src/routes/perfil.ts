import { Router } from "express";
import { z } from "zod";
import { consumoDeHoy } from "../lib/consumoGemini.js";
import { parsear } from "../lib/validacion.js";
import { rateLimiter } from "../middleware/rateLimiter.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as perfilLector from "../servicios/perfilLector.js";

export const perfilRouter = Router();

const limiteIa = rateLimiter({
  ventanaMs: 60 * 1000,
  maximo: 8,
  mensaje: "Esperá un momento antes de seguir la conversación.",
});

const mensajeSchema = z.object({
  mensaje: z.string().trim().min(1, "Escribí algo").max(2000, "El mensaje es muy largo"),
});

perfilRouter.get("/perfil", requireAuth, async (req, res) => {
  const [perfil, mensajes, consumo] = await Promise.all([
    perfilLector.perfilDe(req.userId!),
    perfilLector.historial(req.userId!),
    consumoDeHoy(),
  ]);

  res.json({
    perfil,
    mensajes,
    saludo: perfilLector.SALUDO_INICIAL,
    consumo,
  });
});

perfilRouter.post("/perfil/onboarding", requireAuth, limiteIa, async (req, res) => {
  const { mensaje } = parsear(mensajeSchema, req.body);

  res.json(await perfilLector.responder(req.userId!, mensaje));
});

perfilRouter.post("/perfil/derivar", requireAuth, limiteIa, async (req, res) => {
  res.json({ perfil: await perfilLector.derivar(req.userId!) });
});

perfilRouter.delete("/perfil/onboarding", requireAuth, async (req, res) => {
  await perfilLector.reiniciar(req.userId!);

  res.status(204).end();
});
