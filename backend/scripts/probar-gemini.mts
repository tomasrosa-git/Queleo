import "dotenv/config";
import { z } from "zod";
import { generar } from "../src/servicios/gemini.js";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Falta GEMINI_API_KEY en backend/.env");
  process.exit(1);
}

const modelo = process.env.GEMINI_MODELO ?? "gemini-3.6-flash";

const modelos = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
  headers: { "x-goog-api-key": apiKey },
});

if (!modelos.ok) {
  console.error(`No se pudieron listar los modelos (HTTP ${modelos.status})`);
  console.error(await modelos.text());
  process.exit(1);
}

const { models = [] } = (await modelos.json()) as {
  models?: { name: string; displayName?: string }[];
};
const flash = models.map((m) => m.name.replace(/^models\//, "")).filter((n) => n.includes("flash"));

console.log(`Modelos flash disponibles con esta key (${flash.length}):`);
for (const nombre of flash) {
  console.log(` ${nombre === modelo ? "→" : " "} ${nombre}`);
}
if (!flash.includes(modelo)) {
  console.log(`\nOjo: GEMINI_MODELO está en "${modelo}", que no aparece en la lista.`);
}

// Llama al mismo servicio que usa la app (src/servicios/gemini.ts), no una
// copia de la llamada HTTP — así este script no se puede desincronizar del
// formato real que usa el producto.
console.log(`\nProbando una respuesta estructurada con "${modelo}" (hasta ~65s: hace un reintento automático si el modelo está saturado)…`);

const inicio = Date.now();
try {
  const salida = await generar({
    sistema: "Respondés en español rioplatense, con sobriedad.",
    turnos: [{ rol: "user", texto: "Nombrá una novela argentina breve." }],
    esquema: {
      type: "object",
      properties: { titulo: { type: "string" }, autor: { type: "string" } },
      required: ["titulo", "autor"],
    },
    schema: z.object({ titulo: z.string(), autor: z.string() }),
  });

  console.log(`\nOK en ${Date.now() - inicio}ms:`);
  console.log(JSON.stringify(salida, null, 2));
} catch (e) {
  console.log(`\nFalló en ${Date.now() - inicio}ms: ${(e as Error).message}`);
  console.log(
    "Si dice 'saturadas o sin cupo', es la API de Gemini con demanda alta ahora mismo " +
      "(pasó seguido probando esto) — no es un bug. Reintentá en un rato.",
  );
}
