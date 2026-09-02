import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as googleBooks from "../servicios/googleBooks.js";

export const librosRouter = Router();

librosRouter.get("/libros/buscar", requireAuth, async (req, res) => {
  const consulta = String(req.query.q ?? "").trim();
  if (!consulta) {
    throw new AppError(400, "Falta la consulta de búsqueda");
  }

  res.json({ resultados: await googleBooks.buscar(consulta) });
});

librosRouter.get("/libros/:googleBooksId", requireAuth, async (req, res) => {
  const googleBooksId = String(req.params.googleBooksId);

  const cacheado = await prisma.libro.findUnique({ where: { googleBooksId } });
  if (cacheado) {
    res.json({ libro: cacheado });
    return;
  }

  const externo = await googleBooks.porId(googleBooksId);
  if (!externo) {
    throw new AppError(404, "No encontramos ese libro");
  }

  const libro = await prisma.libro.upsert({
    where: { googleBooksId },
    create: externo,
    update: {},
  });

  res.json({ libro });
});
