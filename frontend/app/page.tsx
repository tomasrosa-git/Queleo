import { API_URL } from "@/lib/api";

type Health = { estado: string; db: string };

async function estadoApi(): Promise<Health | null> {
  try {
    const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
    return (await res.json()) as Health;
  } catch {
    return null;
  }
}

export default async function Home() {
  const health = await estadoApi();

  return (
    <main>
      <p className="mb-2.5 mt-1 text-[11px] uppercase tracking-[0.1em] text-piedra">
        Fase 1 — Setup
      </p>
      <h1 className="mb-2 text-[32px] font-bold leading-tight tracking-tight">
        Queleo
      </h1>
      <p className="mb-8 max-w-[58ch] text-[15px] leading-relaxed text-piedra">
        Un perfil lector construido junto a una IA, y recomendaciones que
        explican por qué te tocan a vos.
      </p>

      <div className="border-y border-linea py-5">
        <p className="mb-2.5 text-[11px] uppercase tracking-[0.1em] text-piedra">
          Estado del entorno
        </p>
        <dl className="flex gap-8 text-[15px] tabular-nums">
          <div>
            <dt className="mb-1 text-[11px] uppercase tracking-[0.08em] text-piedra">
              API
            </dt>
            <dd className={health ? "text-verde" : "text-guinda"}>
              {health ? "conectada" : "sin conexión"}
            </dd>
          </div>
          <div>
            <dt className="mb-1 text-[11px] uppercase tracking-[0.08em] text-piedra">
              Base de datos
            </dt>
            <dd className={health?.db === "ok" ? "text-verde" : "text-guinda"}>
              {health?.db ?? "sin conexión"}
            </dd>
          </div>
        </dl>
      </div>
    </main>
  );
}
