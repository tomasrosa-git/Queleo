import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError } from "../middleware/errorHandler.js";

// El free tier de Gemini da unos 20 requests por día, así que iterar un prompt
// o la UI contra la API real es imposible. Con GEMINI_FIXTURES=grabar se
// captura una vez la respuesta cruda de cada llamada, y con =usar se responde
// desde el disco sin gastar cuota.
export type ModoFixture = "usar" | "grabar" | "vivo";

const DIRECTORIO = path.join(process.cwd(), "fixtures", "gemini");

export function modoFixture(): ModoFixture {
  const configurado = process.env.GEMINI_FIXTURES;
  if (configurado === "usar" || configurado === "grabar") {
    return configurado;
  }
  return "vivo";
}

function rutaDe(nombre: string) {
  return path.join(DIRECTORIO, `${nombre}.json`);
}

// Se guarda la respuesta cruda y no el objeto ya parseado: así el modo "usar"
// sigue pasando por extraerTexto y parsearJson, y un cambio que rompa el
// parseo se nota igual sin tocar la red.
export async function leerFixture(nombre: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(rutaDe(nombre), "utf8"));
  } catch {
    throw new AppError(
      503,
      `Falta la respuesta grabada "${nombre}". Grabala con GEMINI_FIXTURES=grabar y una key con cupo.`,
    );
  }
}

export async function guardarFixture(nombre: string, respuesta: unknown) {
  await mkdir(DIRECTORIO, { recursive: true });
  await writeFile(rutaDe(nombre), `${JSON.stringify(respuesta, null, 2)}\n`, "utf8");
  console.log(`[gemini] respuesta grabada en fixtures/gemini/${nombre}.json`);
}
