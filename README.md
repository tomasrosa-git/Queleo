# Queleo

**[queleo.vercel.app](https://queleo.vercel.app)**

[![CI](https://github.com/tomasrosa-git/Queleo/actions/workflows/ci.yml/badge.svg)](https://github.com/tomasrosa-git/Queleo/actions/workflows/ci.yml)

Plataforma web sobre libros con un perfil lector construido junto a una IA como
eje central. En vez del promedio público de ratings, Queleo arma un perfil a
partir de lo que leíste y cómo lo calificaste, y sobre eso da recomendaciones,
predicciones de puntaje y análisis con el razonamiento explícito de por qué te
tocan a vos.

> El backend corre en el plan gratuito de Render, que apaga el servicio tras
> quince minutos sin tráfico: la primera visita puede tardar hasta un minuto en
> despertar.

## Qué hace

- **Perfil lector conversacional** — el onboarding es una charla con la IA, no
  un formulario de tildes.
- **Recomendaciones explicadas** — cada sugerencia viene con el porqué, apoyado
  en libros puntuales de tu biblioteca: *"le diste un 8 a El túnel por ser
  corto y asfixiante, y esta novela comparte esa contundencia"*.
- **Análisis de libro puntual** — sinopsis, predicción de tu puntaje y el
  razonamiento detrás.
- **Búsqueda por descripción** — "vi Severance y quiero algo con esa vibra": la
  IA traduce el pedido a una forma narrativa antes de proponer libros.
- **Biblioteca personal** — estados de lectura, puntajes y reseñas, con
  importación desde el export de Goodreads.

## Stack

| | |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Backend | Node, Express 5, TypeScript, Prisma 7 |
| Base de datos | PostgreSQL (Supabase) |
| IA | Gemini API (Google AI Studio), modelos Flash |
| Catálogo | Google Books API |
| Deploy | Vercel (frontend) y Render (backend) |
| Gestor de paquetes | pnpm |

`frontend/` y `backend/` son dos servicios independientes, cada uno con su
propio `package.json` y su `pnpm-lock.yaml`.

## Decisiones que vale la pena mirar

- **El razonamiento de la IA se guarda con la recomendación**, no se recalcula:
  el perfil vive en la base y se actualiza cuando hay cambios reales, en vez de
  llamar al modelo en cada visita.
- **Se testea el parseo, no la IA**: lo que se rompe en silencio es el
  procesamiento de respuestas externas — el matching de títulos contra el
  catálogo, la salida estructurada del modelo, el CSV de Goodreads.
- **Respuestas grabadas para desarrollar** (`GEMINI_FIXTURES`): el free tier da
  unas veinte llamadas por día, así que iterar contra la API real no es viable.
  Se graba la respuesta cruda, no la parseada, para que el modo replay siga
  ejercitando el parser.

## Correr el proyecto

Requiere Node 24, pnpm y una base PostgreSQL. Las variables de cada servicio
están documentadas en su `.env.example`, y el deploy en
[`docs/deploy.md`](docs/deploy.md).

```bash
cd backend  && pnpm install && pnpm exec prisma migrate dev && pnpm run dev
cd frontend && pnpm install && pnpm run dev
```

## Licencia

MIT — ver [LICENSE](LICENSE).
