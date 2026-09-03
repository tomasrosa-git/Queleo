import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { validarEntorno } from "./lib/entorno.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { bibliotecaRouter } from "./routes/biblioteca.js";
import { healthRouter } from "./routes/health.js";
import { importacionRouter } from "./routes/importacion.js";
import { librosRouter } from "./routes/libros.js";
import { pairingRouter } from "./routes/pairing.js";
import { perfilRouter } from "./routes/perfil.js";
import { recomendacionesRouter } from "./routes/recomendaciones.js";

validarEntorno();

const app = express();

// En Render hay un proxy (Cloudflare) delante, así que sin esto req.ip es
// siempre la del proxy y el límite por IP del login se cuenta global: diez
// intentos fallidos de una persona dejarían a todos afuera. Es un salto
// porque sólo confía en ese proxy, no en cualquier X-Forwarded-For.
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json({ limit: "3mb" }));
app.use(cookieParser());

app.use(healthRouter);
app.use(authRouter);
app.use(librosRouter);
app.use(bibliotecaRouter);
app.use(importacionRouter);
app.use(perfilRouter);
app.use(recomendacionesRouter);
app.use(pairingRouter);

app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Queleo API escuchando en http://localhost:${port}`);
});
