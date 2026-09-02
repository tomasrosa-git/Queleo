import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Queleo",
  description:
    "Recomendaciones de libros a partir de tu perfil lector, con el razonamiento explícito detrás de cada una.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full">
        <div className="mx-auto max-w-[760px] px-7 pb-16">
          <Nav />
          {children}
        </div>
      </body>
    </html>
  );
}
