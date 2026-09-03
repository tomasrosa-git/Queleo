"use client";

import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";
import { useSesion } from "@/components/SesionProvider";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

type Google = {
  accounts: {
    id: {
      initialize: (config: { client_id: string; callback: (r: { credential: string }) => void }) => void;
      renderButton: (elemento: HTMLElement, opciones: Record<string, unknown>) => void;
    };
  };
};

export function BotonGoogle({ alFallar }: { alFallar: (mensaje: string) => void }) {
  const { ingresarConGoogle } = useSesion();
  const contenedor = useRef<HTMLDivElement>(null);
  const [listo, setListo] = useState(false);
  const id = useId();

  useEffect(() => {
    const google = (window as unknown as { google?: Google }).google;
    if (!listo || !google || !contenedor.current || !CLIENT_ID) {
      return;
    }

    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: ({ credential }) => {
        ingresarConGoogle(credential).catch((e: Error) => alFallar(e.message));
      },
    });

    google.accounts.id.renderButton(contenedor.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      locale: "es",
      width: 320,
    });
  }, [listo, ingresarConGoogle, alFallar]);

  // Sin client id configurado no se muestra nada: es preferible a un botón que
  // falla al tocarlo.
  if (!CLIENT_ID) {
    return null;
  }

  return (
    <div className="mb-6">
      <Script src="https://accounts.google.com/gsi/client" onLoad={() => setListo(true)} />
      <div ref={contenedor} id={id} className="min-h-[44px]" />

      <div className="mt-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-linea" />
        <span className="text-[11px] uppercase tracking-[0.08em] text-piedra">o</span>
        <span className="h-px flex-1 bg-linea" />
      </div>
    </div>
  );
}
