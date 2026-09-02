import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AppError } from "../middleware/errorHandler.js";
import { extraerTexto, limpiarCerca, parsearJson } from "./gemini.js";

const paso = (texto: string) => ({
  type: "model_output",
  content: [{ type: "text", text: texto }],
});

describe("extraerTexto", () => {
  it("saca el texto del paso de salida del modelo", () => {
    expect(extraerTexto({ steps: [paso("hola")] })).toBe("hola");
  });

  it("ignora los pasos que no son salida del modelo", () => {
    const respuesta = {
      steps: [
        { type: "user_input", content: [{ type: "text", text: "pregunta" }] },
        paso("respuesta"),
      ],
    };
    expect(extraerTexto(respuesta)).toBe("respuesta");
  });

  it("concatena las partes cuando la respuesta viene troceada", () => {
    const respuesta = {
      steps: [
        {
          type: "model_output",
          content: [
            { type: "text", text: "primera " },
            { type: "text", text: "segunda" },
          ],
        },
      ],
    };
    expect(extraerTexto(respuesta)).toBe("primera segunda");
  });

  it("descarta partes que no son de texto", () => {
    const respuesta = {
      steps: [
        {
          type: "model_output",
          content: [
            { type: "thought", text: "razonamiento interno" },
            { type: "text", text: "visible" },
          ],
        },
      ],
    };
    expect(extraerTexto(respuesta)).toBe("visible");
  });

  it("falla con una respuesta vacía en vez de devolver cadena vacía", () => {
    expect(() => extraerTexto({})).toThrow(AppError);
    expect(() => extraerTexto({ steps: [] })).toThrow(AppError);
    expect(() => extraerTexto({ steps: [paso("   ")] })).toThrow(AppError);
    expect(() => extraerTexto({ steps: [{ type: "model_output" }] })).toThrow(AppError);
  });
});

describe("limpiarCerca", () => {
  it("saca la cerca de markdown que el modelo agrega a veces", () => {
    expect(limpiarCerca('```json\n{"a":1}\n```')).toBe('{"a":1}');
    expect(limpiarCerca('```\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("deja intacto el JSON pelado", () => {
    expect(limpiarCerca('{"a":1}')).toBe('{"a":1}');
  });

  it("no rompe un JSON que contiene backticks adentro", () => {
    const conBackticks = '{"texto":"usá ```esto``` con cuidado"}';
    expect(limpiarCerca(conBackticks)).toBe(conBackticks);
  });
});

describe("parsearJson", () => {
  const schema = z.object({
    resumen: z.string(),
    generos: z.array(z.string()),
  });

  it("parsea y valida una respuesta correcta", () => {
    const texto = '{"resumen":"Lee ficción literaria","generos":["novela"]}';
    expect(parsearJson(texto, schema)).toEqual({
      resumen: "Lee ficción literaria",
      generos: ["novela"],
    });
  });

  it("parsea igual si viene envuelto en markdown", () => {
    const texto = '```json\n{"resumen":"x","generos":[]}\n```';
    expect(parsearJson(texto, schema).resumen).toBe("x");
  });

  it("falla claro cuando no es JSON", () => {
    expect(() => parsearJson("perdón, no puedo ayudarte con eso", schema)).toThrow(
      AppError,
    );
  });

  it("falla cuando el JSON es válido pero le faltan campos del esquema", () => {
    expect(() => parsearJson('{"resumen":"x"}', schema)).toThrow(AppError);
  });

  it("falla cuando un campo viene con el tipo equivocado", () => {
    expect(() => parsearJson('{"resumen":"x","generos":"novela"}', schema)).toThrow(
      AppError,
    );
  });

  it("devuelve 502 y no 500 ante salida inválida", () => {
    try {
      parsearJson("no es json", schema);
      expect.unreachable();
    } catch (e) {
      expect((e as AppError).status).toBe(502);
    }
  });
});
