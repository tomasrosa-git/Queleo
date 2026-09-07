import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import { Nav } from "@/components/Nav";
import { SesionProvider } from "@/components/SesionProvider";
import "./globals.css";

// Se auto-hospeda en el build: no hay pedido a Google en runtime.
const serif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif-next",
});

export const metadata: Metadata = {
  title: "Queleo",
  description:
    "Recomendaciones de libros a partir de tu perfil lector, con el razonamiento explícito detrás de cada una.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`h-full ${serif.variable}`}>
      <body className="min-h-full">
        <SesionProvider>
          <div className="mx-auto flex min-h-full max-w-[760px] flex-col px-5 pb-10 sm:px-7">
            <Nav />
            <div className="flex-1">{children}</div>

            <footer className="mt-16 border-t border-linea pt-5 text-[12px] leading-relaxed text-piedra">
              Queleo — recomendaciones de libros con el razonamiento a la vista.
            </footer>
          </div>
        </SesionProvider>
      </body>
    </html>
  );
}
