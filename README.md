# Queleo

Plataforma web sobre libros con un perfil lector construido junto a una IA como
eje central: en vez de un promedio público de ratings, recomendaciones y
análisis razonados a partir de quién sos como lector.

La especificación completa está en [`docs/especificacion.md`](docs/especificacion.md).

## Stack

| | |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Backend | Node, Express 5, TypeScript, Prisma 7 |
| Base de datos | PostgreSQL (Supabase) |
| IA | Gemini API (Google AI Studio), modelos Flash |
| Catálogo | Google Books API |
| Deploy | Render |

`frontend/` y `backend/` son dos servicios independientes, cada uno con su
propio `package.json` y su `package-lock.json`.

## Levantar el proyecto

Requiere Node 24 y una base PostgreSQL (en desarrollo, un proyecto de Supabase).

### Backend

```bash
cd backend
npm install
cp .env.example .env   # completar DATABASE_URL y DIRECT_URL
npx prisma migrate dev
npm run dev            # http://localhost:4000
```

`DATABASE_URL` es la connection string del pooler de Supabase, que usa la
aplicación en runtime. `DIRECT_URL` es la conexión directa y la usan las
migraciones, que no pueden ir por el pooler.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3000
```

## Estructura

```
queleo/
├── backend/
│   ├── prisma/schema.prisma
│   └── src/
│       ├── routes/       # capa HTTP, un archivo por recurso
│       ├── servicios/    # lógica de negocio y llamadas externas
│       ├── middleware/   # requireAuth, rateLimiter, errorHandler
│       ├── lib/
│       └── server.ts
├── frontend/
│   ├── app/
│   ├── components/
│   └── lib/
└── docs/
```

## Convención de nombres

El vocabulario de dominio va en español (`libro`, `biblioteca`, `perfilLector`,
`resena`) y las piezas genéricas de infraestructura en inglés (`errorHandler`,
`requireAuth`, `AppError`). La autenticación cuenta como infraestructura: los
modelos `User` y `RefreshToken` están íntegramente en inglés.
