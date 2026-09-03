import { describe, expect, it } from "vitest";

// Espejo de la función del frontend (lib/tipos.ts): el modelo mete énfasis de
// markdown aunque se le pida que no, y el texto se muestra tal cual.
function sinMarkdown(texto: string) {
  return texto.replace(/\*\*?([^*\n]+)\*\*?/g, "$1").replace(/_([^_\n]+)_/g, "$1");
}

describe("sinMarkdown", () => {
  it("saca el énfasis simple y doble", () => {
    // Caso real: el modelo escribió "tal como señalaste en tu lectura de *Trust*".
    expect(sinMarkdown("tu lectura de *Trust*, valorás")).toBe("tu lectura de Trust, valorás");
    expect(sinMarkdown("es **muy** bueno")).toBe("es muy bueno");
    expect(sinMarkdown("un _guion_ bajo")).toBe("un guion bajo");
  });

  it("deja intacto el texto sin marcas", () => {
    const limpio = "Dos poetas desaparecen en el desierto de Sonora.";
    expect(sinMarkdown(limpio)).toBe(limpio);
  });

  it("no se come un asterisco suelto", () => {
    expect(sinMarkdown("3 * 4 = 12")).toBe("3 * 4 = 12");
  });
});
