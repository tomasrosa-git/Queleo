export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const cuerpo = await res.json();
  if (!res.ok) {
    throw new Error(cuerpo.error ?? "Error de red");
  }

  return cuerpo as T;
}
