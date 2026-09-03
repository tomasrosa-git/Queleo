"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { alCaerLaSesion, apiFetch, guardarToken } from "@/lib/api";

export type Usuario = { id: string; email: string; name: string };

type Respuesta = { user: Usuario; accessToken: string };

type Sesion = {
  usuario: Usuario | null;
  cargando: boolean;
  ingresar: (email: string, password: string) => Promise<void>;
  registrarse: (email: string, password: string, name: string) => Promise<void>;
  salir: () => Promise<void>;
};

const SesionContext = createContext<Sesion | null>(null);

export function SesionProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  function aplicar({ user, accessToken }: Respuesta) {
    guardarToken(accessToken);
    setUsuario(user);
  }

  // Si la sesión no se puede renovar, la UI tiene que enterarse: si no,
  // el nav sigue mostrando al usuario como conectado.
  useEffect(() => {
    alCaerLaSesion(() => {
      guardarToken(null);
      setUsuario(null);
    });
  }, []);

  useEffect(() => {
    apiFetch<Respuesta>("/auth/refresh", { method: "POST" })
      .then(aplicar)
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false));
  }, []);

  const sesion: Sesion = {
    usuario,
    cargando,
    async ingresar(email, password) {
      aplicar(
        await apiFetch<Respuesta>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        }),
      );
    },
    async registrarse(email, password, name) {
      aplicar(
        await apiFetch<Respuesta>("/auth/register", {
          method: "POST",
          body: JSON.stringify({ email, password, name }),
        }),
      );
    },
    async salir() {
      await apiFetch("/auth/logout", { method: "POST" });
      guardarToken(null);
      setUsuario(null);
    },
  };

  return <SesionContext value={sesion}>{children}</SesionContext>;
}

export function useSesion() {
  const sesion = useContext(SesionContext);
  if (!sesion) {
    throw new Error("useSesion tiene que usarse dentro de SesionProvider");
  }
  return sesion;
}

export function useRequiereSesion() {
  const { usuario, cargando } = useSesion();
  const router = useRouter();

  useEffect(() => {
    if (!cargando && !usuario) {
      router.replace("/ingresar");
    }
  }, [cargando, usuario, router]);

  return { usuario, cargando };
}

export function useSoloInvitados() {
  const { usuario, cargando } = useSesion();
  const router = useRouter();

  useEffect(() => {
    if (!cargando && usuario) {
      router.replace("/buscar");
    }
  }, [cargando, usuario, router]);
}
