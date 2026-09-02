import { Router } from "express";
import { AppError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as googleBooks from "../servicios/googleBooks.js";
import { asegurarLibro } from "../servicios/libros.js";

export const librosRouter = Router();

librosRouter.get("/libros/buscar", requireAuth, async (req, res) => {
  const consulta = String(req.query.q ?? "").trim();
  if (!consulta) {
    throw new AppError(400, "Falta la consulta de búsqueda");
  }

  res.json({ resultados: await googleBooks.buscar(consulta) });
});

librosRouter.get("/libros/:googleBooksId", requireAuth, async (req, res) => {
  res.json({ libro: await asegurarLibro(String(req.params.googleBooksId)) });
});
