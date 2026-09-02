# Queleo

Plataforma web sobre libros con un perfil lector construido junto a una IA como
eje central. En vez del promedio público de ratings, Queleo arma un perfil a
partir de lo que leíste y cómo lo calificaste, y sobre eso da recomendaciones,
predicciones de puntaje y análisis con el razonamiento explícito de por qué te
tocan a vos.

- **Perfil lector conversacional** — el onboarding es una charla con la IA, no
  un formulario de tildes.
- **Recomendaciones explicadas** — cada sugerencia viene con el porqué, en un
  bloque con el mismo rol que la nota de edición al final de un libro.
- **Análisis de libro puntual** — sinopsis, predicción de tu rating y el
  razonamiento detrás, contrastado contra el promedio público.
- **Book pairing por texto libre** — "vi Severance y quiero algo con esa vibra".
- **Biblioteca personal** — estados de lectura, ratings y reseñas propias.

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
