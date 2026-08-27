import "dotenv/config";
import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import { healthRouter } from "./routes/health.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());

app.use(healthRouter);

app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Queleo API escuchando en http://localhost:${port}`);
});
