import "dotenv/config";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Falta GEMINI_API_KEY en backend/.env");
  process.exit(1);
}

const modelo = process.env.GEMINI_MODELO ?? "gemini-flash-latest";

const modelos = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models",
  { headers: { "x-goog-api-key": apiKey } },
);

if (!modelos.ok) {
  console.error(`No se pudieron listar los modelos (HTTP ${modelos.status})`);
  console.error(await modelos.text());
  process.exit(1);
}

const { models = [] } = (await modelos.json()) as {
  models?: { name: string; displayName?: string }[];
};
const flash = models
  .map((m) => m.name.replace(/^models\//, ""))
  .filter((n) => n.includes("flash"));

console.log(`Modelos flash disponibles con esta key (${flash.length}):`);
for (const nombre of flash) {
  console.log(` ${nombre === modelo ? "→" : " "} ${nombre}`);
}

if (!flash.includes(modelo)) {
  console.log(`\nOjo: GEMINI_MODELO está en "${modelo}", que no aparece en la lista.`);
}

console.log(`\nProbando una respuesta estructurada con "${modelo}"…`);

const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
  body: JSON.stringify({
    model: modelo,
    input: [{ role: "user", parts: [{ type: "text", text: "Nombrá una novela argentina." }] }],
    system_instruction: "Respondés en español rioplatense, con sobriedad.",
    store: false,
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: {
        type: "object",
        properties: { titulo: { type: "string" }, autor: { type: "string" } },
        required: ["titulo", "autor"],
      },
    },
  }),
});

console.log(`HTTP ${res.status}`);
console.log(JSON.stringify(await res.json(), null, 2));
