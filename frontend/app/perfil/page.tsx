"use client";

import { useEffect, useState } from "react";
import { Colofon } from "@/components/Colofon";
import { Estante } from "@/components/Estante";
import { Numeros } from "@/components/Numeros";
import { useRequiereSesion } from "@/components/SesionProvider";
import { apiFetch } from "@/lib/api";
import type {
  EstadoPerfil,
  MensajeOnboarding,
  PerfilLector,
  ResumenBiblioteca,
} from "@/lib/tipos";

export default function Perfil() {
  const { usuario, cargando } = useRequiereSesion();
  const [estado, setEstado] = useState<EstadoPerfil | null>(null);
  const [resumen, setResumen] = useState<ResumenBiblioteca | null>(null);
  const [borrador, setBorrador] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [derivando, setDerivando] = useState(false);
  const [suficiente, setSuficiente] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!usuario) return;

    let vigente = true;
    apiFetch<EstadoPerfil>("/perfil")
      .then((datos) => vigente && setEstado(datos))
      .catch((e) => vigente && setError((e as Error).message));

    // Los números salen de la biblioteca, no del perfil: se piden aparte para
    // que la página no dependa de que exista un perfil derivado.
    apiFetch<ResumenBiblioteca>("/biblioteca/estadisticas")
      .then((datos) => vigente && setResumen(datos))
      .catch(() => {});

    return () => {
      vigente = false;
    };
  }, [usuario]);

  function agregar(mensajes: MensajeOnboarding[]) {
    setEstado((previo) => (previo ? { ...previo, mensajes } : previo));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const mensaje = borrador.trim();
    if (!mensaje || !estado) return;

    setEnviando(true);
    setError(null);

    const propio: MensajeOnboarding = {
      id: `local-${Date.now()}`,
      rol: "USUARIO",
      contenido: mensaje,
    };
    agregar([...estado.mensajes, propio]);
    setBorrador("");

    try {
      const salida = await apiFetch<{ respuesta: string; suficiente: boolean }>(
        "/perfil/onboarding",
        { method: "POST", body: JSON.stringify({ mensaje }) },
      );

      agregar([
        ...estado.mensajes,
        propio,
        { id: `local-${Date.now()}-r`, rol: "ASISTENTE", contenido: salida.respuesta },
      ]);
      setSuficiente(salida.suficiente);
    } catch (e) {
      setError((e as Error).message);
      agregar(estado.mensajes);
      setBorrador(mensaje);
    } finally {
      setEnviando(false);
    }
  }

  async function derivarPerfil() {
    setDerivando(true);
    setError(null);

    try {
      const { perfil } = await apiFetch<{ perfil: PerfilLector }>("/perfil/derivar", {
        method: "POST",
      });
      setEstado((previo) => (previo ? { ...previo, perfil } : previo));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDerivando(false);
    }
  }

  async function reiniciar() {
    await apiFetch("/perfil/onboarding", { method: "DELETE" });
    setEstado((previo) => (previo ? { ...previo, mensajes: [] } : previo));
    setSuficiente(false);
  }

  if (cargando || !usuario) {
    return null;
  }

  if (!estado) {
    return <p className="text-[15px] text-piedra">{error ?? "Cargando…"}</p>;
  }

  const { perfil, mensajes, saludo } = estado;
  const hayConversacion = mensajes.length > 0;

  return (
    <main>
      <p className="mb-2.5 mt-1 text-[11px] uppercase tracking-[0.1em] text-piedra">
        Perfil
      </p>
      <h1 className="mb-8 text-[32px] font-bold leading-tight tracking-tight">
        {usuario.name}
      </h1>

      {resumen && resumen.estadisticas.leidos > 0 && (
        <>
          <Estante entradas={resumen.estante} />
          <Numeros datos={resumen.estadisticas} />
        </>
      )}

      {perfil && (
        <Colofon
          titulo="Tu perfil lector"
          fuente={`Actualizado el ${new Date(perfil.actualizadoEn).toLocaleDateString("es-AR")}`}
        >
          <p className="mb-4 max-w-[58ch] text-[15px] leading-relaxed">
            {perfil.resumen}
          </p>

          <dl className="m-0 flex flex-col gap-3">
            {[
              { termino: "Géneros", valores: perfil.generos },
              { termino: "Autores", valores: perfil.autores },
              { termino: "Patrones", valores: perfil.patrones },
            ]
              .filter(({ valores }) => valores.length > 0)
              .map(({ termino, valores }) => (
                <div key={termino}>
                  <dt className="mb-1 text-[11px] uppercase tracking-[0.08em] text-piedra">
                    {termino}
                  </dt>
                  <dd className="m-0 max-w-[58ch] text-[15px] leading-relaxed">
                    {valores.join(" · ")}
                  </dd>
                </div>
              ))}
          </dl>
        </Colofon>
      )}

      <p className="mb-6 text-[13px] uppercase tracking-[0.06em] text-piedra">
        {perfil ? "Seguir la conversación" : "Entrevista"}
      </p>

      <div className="mb-8 flex flex-col gap-6">
        {!hayConversacion && (
          <Turno rol="ASISTENTE" texto={saludo} />
        )}
        {mensajes.map((mensaje) => (
          <Turno key={mensaje.id} rol={mensaje.rol} texto={mensaje.contenido} />
        ))}
      </div>

      {error && <p className="mb-5 text-[13px] text-guinda">{error}</p>}

      <form onSubmit={enviar} className="flex flex-col gap-3">
        <textarea
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          rows={3}
          placeholder="Contale qué leíste"
          className="w-full max-w-[58ch] rounded-xs border border-linea bg-tarjeta px-3 py-2.5 text-[15px] leading-relaxed outline-none focus:border-tinta"
        />

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={enviando || !borrador.trim()}
            className="cursor-pointer rounded-xs border-none bg-guinda px-5 py-3 text-[13px] font-medium text-papel hover:bg-guinda-hover disabled:opacity-50"
          >
            {enviando ? "Enviando…" : "Enviar"}
          </button>

          {(suficiente || hayConversacion) && (
            <button
              type="button"
              onClick={derivarPerfil}
              disabled={derivando}
              className="cursor-pointer rounded-xs border border-tinta bg-transparent px-5 py-3 text-[13px] font-medium text-tinta hover:bg-tinta hover:text-papel disabled:opacity-50"
            >
              {derivando ? "Armando…" : perfil ? "Actualizar mi perfil" : "Armar mi perfil"}
            </button>
          )}

          {hayConversacion && (
            <button
              type="button"
              onClick={reiniciar}
              className="ml-auto cursor-pointer border-none bg-transparent p-0 text-[13px] text-piedra underline hover:text-guinda"
            >
              Empezar de nuevo
            </button>
          )}
        </div>
      </form>
    </main>
  );
}

function Turno({ rol, texto }: { rol: "USUARIO" | "ASISTENTE"; texto: string }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] uppercase tracking-[0.08em] text-piedra">
        {rol === "ASISTENTE" ? "Queleo" : "Vos"}
      </p>
      <p
        className={`m-0 max-w-[58ch] text-[15px] leading-relaxed ${
          rol === "USUARIO" ? "border-l border-linea pl-4 text-piedra" : ""
        }`}
      >
        {texto}
      </p>
    </div>
  );
}
