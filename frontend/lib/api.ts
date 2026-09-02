export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// El access token vive sólo en memoria: nunca en localStorage, para que no
// quede accesible desde JS de terceros ni sobreviva al cierre de la pestaña.
let accessToken: string | null = null;

export function guardarToken(token: string | null) {
  accessToken = token;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const cuerpo = await res.json();
  if (!res.ok) {
    throw new Error(cuerpo.error ?? "No pudimos completar la operación");
  }

  return cuerpo as T;
}
