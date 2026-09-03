import type { NextConfig } from "next";

// NEXT_PUBLIC_API_URL se incrusta en el bundle durante el build: si falta en
// producción, el sitio queda apuntando a localhost y falla recién en el
// navegador del visitante. Mejor que no compile.
if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    "Falta NEXT_PUBLIC_API_URL: tiene que ser la URL pública de la API (la de Render).",
  );
}

const nextConfig: NextConfig = {
  agentRules: false,
};

export default nextConfig;
