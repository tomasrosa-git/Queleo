"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Campo } from "@/components/Campo";
import { useSesion, useSoloInvitados } from "@/components/SesionProvider";

export default function Ingresar() {
  const router = useRouter();
  const { ingresar } = useSesion();
  useSoloInvitados();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    try {
      await ingresar(email, password);
      router.push("/buscar");
    } catch (e) {
      setError((e as Error).message);
      setEnviando(false);
    }
  }

  return (
    <main className="max-w-[380px]">
      <h1 className="mb-8 text-[27px] font-bold tracking-tight">Ingresar</h1>

      <form onSubmit={enviar} className="flex flex-col gap-5">
        <Campo etiqueta="Email" tipo="email" valor={email} onChange={setEmail} autoComplete="email" />
        <Campo
          etiqueta="Contraseña"
          tipo="password"
          valor={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        {error && <p className="text-[13px] text-guinda">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="mt-1 cursor-pointer rounded-xs border-none bg-guinda px-5 py-3 text-[13px] font-medium tracking-[0.02em] text-papel hover:bg-guinda-hover disabled:opacity-50"
        >
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-[13px] text-piedra">
        ¿Todavía no tenés cuenta?{" "}
        <Link href="/registro" className="text-guinda">
          Creá una
        </Link>
      </p>
    </main>
  );
}
