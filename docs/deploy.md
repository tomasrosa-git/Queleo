# Deploy

El frontend va a **Vercel** y la API a **Render**. Están separados a propósito:
Render da 750 horas de instancia por mes compartidas entre todos los servicios
free de la cuenta, así que poner también el frontend ahí consumía el doble del
mismo cupo.

## 1. API en Render

Con `render.yaml` en la raíz, desde el dashboard: **New → Blueprint** y apuntar
al repo. Toma el servicio de ahí.

Las variables marcadas como `sync: false` se cargan a mano:

| Variable | De dónde sale |
|---|---|
| `DATABASE_URL` | Supabase → Connect → Transaction pooler (puerto 6543) |
| `DIRECT_URL` | Supabase → Connect → conexión directa (puerto 5432) |
| `JWT_SECRET` | generar: `openssl rand -base64 48` |
| `GEMINI_API_KEY` | Google AI Studio |
| `GOOGLE_BOOKS_API_KEY` | Google Cloud Console, con la Books API habilitada |
| `CORS_ORIGIN` | la URL de Vercel, **sin barra final** |

El servicio no arranca si falta alguna: valida al inicio y escribe qué falta
en el log, en vez de fallar más tarde disfrazado de otra cosa.

`CORS_ORIGIN` es la que más se olvida y la que peor síntoma da: el login
"no hace nada" en el navegador sin error visible en la API.

## 2. Frontend en Vercel

**Add New → Project**, importar el repo y configurar:

- **Root Directory:** `frontend`
- **Environment Variables:** `NEXT_PUBLIC_API_URL` = la URL de Render, sin
  barra final.

Vercel detecta pnpm y Next solo. Si falta `NEXT_PUBLIC_API_URL`, el build
falla a propósito: esa variable se incrusta en el bundle, así que sin ella el
sitio quedaría apuntando a localhost y fallaría recién en el navegador del
visitante.

## 3. Orden

La API primero: hasta no tener su URL no se puede completar Vercel, y hasta no
tener la de Vercel no se puede completar `CORS_ORIGIN`. Es decir: crear la API
(queda a medias), crear el frontend con la URL de la API, y volver a Render a
cargar `CORS_ORIGIN`.

## Lo que hay que saber del plan free

- **El servicio duerme.** Render apaga los servicios free tras 15 minutos sin
  tráfico, y despertar tarda entre 30 y 60 segundos. El primero que abra el
  link después de un rato va a esperar eso: para un portfolio que se comparte
  por link, es el problema más visible del deploy.
- **La base está en São Paulo y la API en Virginia**, porque Render no tiene
  región en Sudamérica. Cada consulta paga ese viaje.
- **Las migraciones corren en cada build** (`prisma migrate deploy`), así que
  un deploy con una migración nueva la aplica solo.
- **El healthcheck pega a la base.** Si Supabase pausa el proyecto por
  inactividad (lo hace tras una semana sin uso en el plan free), Render va a
  ver el servicio como caído. Si eso pasa, despausar el proyecto en Supabase.
