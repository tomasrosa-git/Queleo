import { z } from "zod";

// Estas variables sólo se leen cuando ya hace falta, y si faltan el error
// aparece recién ante el primer usuario y disfrazado de otra cosa: un 500 al
// firmar el token, o un CORS que rebota sin explicación. Se validan al
// arrancar para que el deploy falle acá y no allá.
const enProduccion = process.env.NODE_ENV === "production";

const esquema = z.object({
  DATABASE_URL: z.string().min(1, "Falta DATABASE_URL (connection string del pooler)"),
  DIRECT_URL: z.string().min(1, "Falta DIRECT_URL (conexión directa, para migraciones)"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET tiene que ser una cadena larga y aleatoria"),
  CORS_ORIGIN: enProduccion
    ? z.string().url("CORS_ORIGIN tiene que ser la URL del frontend")
    : z.string().optional(),
});

export function validarEntorno() {
  const resultado = esquema.safeParse(process.env);

  if (!resultado.success) {
    const problemas = resultado.error.issues.map((i) => `  - ${i.message}`).join("\n");
    console.error(`No se puede arrancar por la configuración:\n${problemas}`);
    process.exit(1);
  }

  if (enProduccion && process.env.GEMINI_FIXTURES) {
    console.error(
      "GEMINI_FIXTURES está definida en producción: las respuestas grabadas son " +
        "sólo para desarrollo. Sacala del entorno del servicio.",
    );
    process.exit(1);
  }

  if (!process.env.GEMINI_API_KEY) {
    console.warn("Sin GEMINI_API_KEY: las funciones con IA van a responder 503.");
  }
}
