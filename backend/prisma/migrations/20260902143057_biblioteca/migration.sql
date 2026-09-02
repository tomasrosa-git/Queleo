-- CreateEnum
CREATE TYPE "EstadoLectura" AS ENUM ('QUIERO_LEER', 'LEYENDO', 'LEIDO');

-- CreateTable
CREATE TABLE "EntradaBiblioteca" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "libroId" TEXT NOT NULL,
    "estado" "EstadoLectura" NOT NULL,
    "rating" INTEGER,
    "resena" TEXT,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntradaBiblioteca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntradaBiblioteca_usuarioId_estado_idx" ON "EntradaBiblioteca"("usuarioId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "EntradaBiblioteca_usuarioId_libroId_key" ON "EntradaBiblioteca"("usuarioId", "libroId");

-- AddForeignKey
ALTER TABLE "EntradaBiblioteca" ADD CONSTRAINT "EntradaBiblioteca_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntradaBiblioteca" ADD CONSTRAINT "EntradaBiblioteca_libroId_fkey" FOREIGN KEY ("libroId") REFERENCES "Libro"("id") ON DELETE CASCADE ON UPDATE CASCADE;
