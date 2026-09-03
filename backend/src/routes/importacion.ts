import { Router } from "express";
import { z } from "zod";
import { parsear } from "../lib/validacion.js";
import { rateLimiter } from "../middleware/rateLimiter.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { importarLote, parsearCsvGoodreads } from "../servicios/importacion.js";

export const importacionRouter = Router();

// Cada libro del lote es una consulta al catálogo, así que el techo se cuenta
// en lotes y no en libros.
const limiteImportacion = rateLimiter({
  ventanaMs: 10 * 60 * 1000,
  maximo: 40,
  mensaje: "Demasiadas importaciones seguidas. Esperá unos minutos.",
});

const csvSchema = z.object({
  csv: z.string().min(1, "El archivo está vacío").max(2_000_000, "El archivo es demasiado grande"),
});

const loteSchema = z.object({
  libros: z
    .array(
      z.object({
        titulo: z.string().min(1),
        autor: z.string().min(1),
        isbn: z.string().nullable(),
        rating: z.number().int().min(1).max(10).nullable(),
        resena: z.string().nullable(),
        estado: z.enum(["QUIERO_LEER", "LEYENDO", "LEIDO"]),
      }),
    )
    .min(1, "El lote está vacío")
    .max(10, "El lote es demasiado grande"),
});

// Sólo lee el archivo y devuelve lo que encontró: no toca la base, así se
// puede mostrar qué se va a importar antes de confirmar.
importacionRouter.post("/importar/analizar", requireAuth, async (req, res) => {
  const { csv } = parsear(csvSchema, req.body);

  res.json({ libros: parsearCsvGoodreads(csv) });
});

importacionRouter.post("/importar", requireAuth, limiteImportacion, async (req, res) => {
  const { libros } = parsear(loteSchema, req.body);

  res.json(await importarLote(req.userId!, libros));
});
