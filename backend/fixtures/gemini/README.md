# Respuestas grabadas de Gemini

El free tier da unas 20 llamadas por día, así que iterar un prompt o la UI
contra la API real no es viable. Acá viven respuestas crudas de cada tipo de
llamada, para desarrollar sin gastar cupo:

```bash
GEMINI_FIXTURES=usar pnpm run dev     # responde desde estos archivos
GEMINI_FIXTURES=grabar pnpm run dev   # llama a la API y sobrescribe el archivo
```

Se guarda la respuesta **cruda** y no el objeto ya parseado, así el modo `usar`
sigue pasando por `extraerTexto` y `parsearJson`: si un cambio rompe el
parseo, se nota sin tocar la red.

| Archivo | Estado |
|---|---|
| `onboarding.json` | contenido real de la API; el envoltorio se rearmó a mano |
| `perfil.json` | contenido real de la API; el envoltorio se rearmó a mano |
| `recomendaciones.json` | **falta** — nunca hubo cupo para capturarla |

Los dos primeros salieron de llamadas reales del 2026-09-02, pero se
reconstruyó el sobre (`id`, `usage`, `signature`) en vez de copiarlo byte a
byte. Conviene regrabarlos con `GEMINI_FIXTURES=grabar` cuando haya cupo, para
tener capturas exactas.
