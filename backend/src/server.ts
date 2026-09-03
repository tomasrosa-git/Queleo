import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { bibliotecaRouter } from "./routes/biblioteca.js";
import { healthRouter } from "./routes/health.js";
import { librosRouter } from "./routes/libros.js";
import { pairingRouter } from "./routes/pairing.js";
import { perfilRouter } from "./routes/perfil.js";
import { recomendacionesRouter } from "./routes/recomendaciones.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use(healthRouter);
app.use(authRouter);
app.use(librosRouter);
app.use(bibliotecaRouter);
app.use(perfilRouter);
app.use(recomendacionesRouter);
app.use(pairingRouter);

app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Queleo API escuchando en http://localhost:${port}`);
});
