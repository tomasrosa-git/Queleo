import { Router } from "express";
import { AppError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as analisis from "../servicios/analisis.js";
import * as googleBooks from "../servicios/googleBooks.js";
import { asegurarLibro } from "../servicios/libros.js";
import { rateLimiter } from "../middleware/rateLimiter.js";

export const librosRouter = Router();

const limiteIa = rateLimiter({
  ventanaMs: 5 * 60 * 1000,
  maximo: 6,
  mensaje: "Esperá unos minutos antes de pedir otro análisis.",
});

// Consultar el catálogo gasta cuota de Google Books (unas mil por día), y
// estos son los únicos endpoints que la consumen sin pasar por la IA. El
// techo es alto a propósito: quien arma su biblioteca busca seguido, así que
// esto frena un bucle, no el uso normal.
const limiteCatalogo = rateLimiter({
  ventanaMs: 60 * 1000,
  maximo: 30,
  mensaje: "Demasiadas búsquedas seguidas. Esperá unos segundos.",
});

librosRouter.get("/libros/buscar", requireAuth, limiteCatalogo, async (req, res) => {
  const consulta = String(req.query.q ?? "").trim();
  if (!consulta) {
    throw new AppError(400, "Falta la consulta de búsqueda");
  }

  res.json({ resultados: await googleBooks.buscar(consulta) });
});

librosRouter.get("/libros/:googleBooksId", requireAuth, limiteCatalogo, async (req, res) => {
  res.json({ libro: await asegurarLibro(String(req.params.googleBooksId)) });
});

librosRouter.get("/libros/:googleBooksId/analisis", requireAuth, async (req, res) => {
  const libro = await asegurarLibro(String(req.params.googleBooksId));

  res.json({ analisis: await analisis.analisisDe(req.userId!, libro.id) });
});

librosRouter.post(
  "/libros/:googleBooksId/analisis",
  requireAuth,
  limiteIa,
  async (req, res) => {
    res.json({
      analisis: await analisis.analizar(req.userId!, String(req.params.googleBooksId)),
    });
  },
);
