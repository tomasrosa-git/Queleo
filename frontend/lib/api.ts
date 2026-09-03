export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const RUTA_REFRESH = "/auth/refresh";

// El access token vive sólo en memoria: nunca en localStorage, para que no
// quede accesible desde JS de terceros ni sobreviva al cierre de la pestaña.
let accessToken: string | null = null;
let alPerderSesion: (() => void) | null = null;

export function guardarToken(token: string | null) {
  accessToken = token;
}

export function alCaerLaSesion(callback: () => void) {
  alPerderSesion = callback;
}

// Varias llamadas pueden chocarse con el token vencido a la vez; sin esto
// cada una dispararía su propio refresh.
let refrescando: Promise<string | null> | null = null;

function refrescar() {
  refrescando ??= (async () => {
    try {
      const res = await fetch(`${API_URL}${RUTA_REFRESH}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        return null;
      }

      const { accessToken: nuevo } = await res.json();
      guardarToken(nuevo);
      return nuevo as string;
    } catch {
      return null;
    } finally {
      refrescando = null;
    }
  })();

  return refrescando;
}

async function pedir(path: string, init?: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  });
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res = await pedir(path, init);

  // El access token dura 15 minutos: con la pestaña abierta un rato, la
  // primera acción al volver se encuentra con el token vencido. Se renueva
  // con la cookie y se reintenta, en vez de mostrarle el error al usuario.
  if (res.status === 401 && path !== RUTA_REFRESH) {
    if (await refrescar()) {
      res = await pedir(path, init);
    } else {
      alPerderSesion?.();
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const cuerpo = await res.json();
  if (!res.ok) {
    throw new Error(cuerpo.error ?? "No pudimos completar la operación");
  }

  return cuerpo as T;
}
