# Queleo

Plataforma web sobre **libros**, con un perfil lector construido junto a una IA
como eje central — no un catálogo estático de ratings promedio, sino
recomendaciones y opiniones razonadas a partir de quién sos como lector.

## Contexto y objetivo

Proyecto de portfolio personal. No busca escalar ni competir con Goodreads;
busca demostrar una integración de LLM con propósito real (no un chatbot
pegado al costado) sobre un dominio de datos concreto. Segundo proyecto de
portfolio después de [Raccord](https://raccord.com.ar) — mismo nivel de
prolijidad y mismas convenciones de stack, dominio distinto.

## Características (MVP)

- **Perfil lector conversacional:** onboarding en forma de chat con la IA
  (no un formulario de tildes) que deriva gustos, géneros, autores y
  patrones a partir de lo que el usuario cuenta y de los libros que ya
  calificó.
- **Recomendaciones explicadas:** dado el perfil, sugiere libros con el
  razonamiento explícito de por qué calzan ("porque tu promedio en fantasía
  dura es alto pero preferís libros de menos de 400 páginas").
- **Análisis de libro puntual:** el usuario tira un título y la IA devuelve
  sinopsis breve + predicción de rating personal (1-10) + el razonamiento
  detrás, contrastado contra el rating promedio público del libro.
- **Book pairing por texto libre:** input libre tipo "vi Severance y quiero
  algo con esa vibra" o "estoy con ganas de algo liviano" → la IA lo
  interpreta como contexto y busca en el catálogo, sin necesidad de modelar
  series/películas como entidades propias.
- **Biblioteca personal:** estados (leyendo / leído / quiero leer), ratings
  y reseñas propias — la base tipo Goodreads sobre la que se apoya todo lo
  anterior.

## Dirección visual

Registro formal y limpio, deliberadamente opuesto a la densidad de
Goodreads (una pantalla, una decisión, mucho aire — no diez secciones
compitiendo por atención).

- **Paleta:** papel `#F5F4F0`, tinta `#201E1B`, guinda `#7A2E32`, verde
  inglés `#34473B`, piedra `#86807A`, línea `#D9D5CB` — colores de tela de
  tapa dura en vez de la paleta cream+terracota genérica.
- **Tipografía:** una sola familia, sistema (`"Helvetica Neue", Helvetica,
  Arial, sans-serif`, sin webfont). Jerarquía por peso y tamaño, nunca por
  mezcla de familias. Números (ISBN, páginas, puntaje) con
  `font-variant-numeric: tabular-nums` para que alineen sin necesitar una
  fuente monoespaciada.
- **Elemento propio — el colofón:** bloque que explica el porqué de cada
  recomendación, con el mismo rol que la nota de edición al final de un
  libro real. Es donde vive la feature central del producto, no decoración.
- **Esquinas:** radio mínimo (2px), nunca redondeadas — refuerza el
  registro formal.
- **Movimiento:** mínimo — el lomo de un libro se levanta levemente al
  pasar el mouse en la vista de estante; nada más se anima.
- Mockup de referencia: `queleo-mockup.html` (ficha de libro).

## Estructura

```
queleo/
├── backend/
│   ├── src/
│   │   ├── routes/          # capa HTTP, un archivo por recurso
│   │   ├── servicios/       # lógica de negocio y llamadas externas
│   │   │   ├── gemini.ts
│   │   │   ├── googleBooks.ts
│   │   │   ├── perfilLector.ts
│   │   │   └── recomendaciones.ts
│   │   ├── middleware/      # requireAuth, rateLimiter, errorHandler
│   │   ├── lib/
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── biblioteca/
│   │   ├── perfil/
│   │   ├── libro/[id]/
│   │   └── layout.tsx
│   ├── components/
│   ├── lib/
│   └── package.json
├── docs/
│   └── especificacion.md
└── .gitignore              # incluye STATE.md, .env, node_modules
```

- `backend/` — API REST: Node.js + Express + TypeScript + Prisma (PostgreSQL
  en Supabase). La capa de `servicios/` separa la lógica (llamados a Gemini,
  a Google Books, cálculo de perfil) de las rutas, para poder testear el
  parseo de la salida de Gemini sin levantar un servidor HTTP.
- `frontend/` — Next.js (App Router) + TypeScript + Tailwind CSS. Rutas de
  `app/` mapeadas 1:1 a las features del MVP.
- `docs/` — este documento y los que se sumen por fase.

## Decisiones técnicas

- **Sin proxy de imágenes:** las tapas se muestran por URL directa de la
  Google Books API (no hay API pública de Goodreads desde 2020). Esto evita
  el problema de egress que tuvo Raccord con las paletas de color — acá no
  hay motivo para que el backend descargue o reprocese imágenes.
- **Perfil lector cacheado, no recalculado en cada request:** el perfil
  vive como un registro en DB que se actualiza cuando hay cambios
  significativos (nuevo rating, nueva conversación de onboarding), no se
  reconstruye con un llamado a la IA en cada página vista.
- **Contexto acotado a la IA:** en cada llamado se manda perfil resumido +
  un subconjunto acotado de ratings relevantes (por afinidad de género/autor
  al libro consultado, no el historial completo) + metadata del libro. Evita
  prompts gigantes y respuestas lentas/caras.
- **Salida estructurada:** los llamados a la API de Gemini piden JSON
  (sinopsis, score, razonamiento) para poder renderizarlo en UI sin parseo
  frágil de texto libre.
- **Manejo de cuota agotada:** el free tier de Gemini tiene un techo diario
  de requests. Si se agota, los endpoints de IA devuelven un error claro y
  el frontend cae a un estado degradado (recomendaciones no disponibles por
  hoy) en vez de romper la página.
- **Prisma sobre TypeORM:** mismo criterio que Raccord — tipado generado
  desde el schema, nunca se desincroniza.
- **Auth:** mismo esquema que Raccord (JWT de acceso en memoria, refresh
  token de 30 días en cookie httpOnly/secure, hasheado en DB).
- **Fuente de catálogo:** Google Books API como fuente primaria de metadata
  y tapas; se cachea localmente lo mínimo necesario (id, título, autor,
  isbn) para no depender de la disponibilidad de la API en cada request.

## Infraestructura

- **Base de datos:** Supabase (Postgres gestionado) — mismo proveedor que
  Raccord, sin el riesgo de egress porque no hay tráfico de imágenes.
- **Backend y frontend:** Render (Web Services)
- **IA:** Gemini API (Google AI Studio), modelos Flash — free tier, sin
  costo, con límite diario de requests
- **Dominio:** a definir
- **Datos externos:** Google Books API

## Fases sugeridas (una rama/PR por fase)

1. **Setup** — estructura del repo, Prisma schema base, conexión a
   Supabase, `STATE.md` inicial.
2. **Auth + catálogo básico** — JWT/refresh, búsqueda de libros vía Google
   Books API, cacheo local de metadata.
3. **Biblioteca personal** — estados de lectura, ratings, reseñas propias.
4. **Perfil lector con IA** — onboarding conversacional, derivación y
   guardado del perfil.
5. **Recomendaciones explicadas** — endpoint que cruza perfil + catálogo y
   devuelve sugerencias con razonamiento.
6. **Análisis de libro puntual** — sinopsis + score predicho + razonamiento
   para un libro específico.
7. **Book pairing por texto libre** — interpretación de input libre (mood,
   referencias a otros medios) como filtro de búsqueda.
8. **Pulido y deploy** — dominio, README, despliegue final.
