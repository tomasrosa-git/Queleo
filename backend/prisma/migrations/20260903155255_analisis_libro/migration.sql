-- AlterTable
ALTER TABLE "Libro" ADD COLUMN     "cantidadRatings" INTEGER,
ADD COLUMN     "ratingPublico" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "AnalisisLibro" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "libroId" TEXT NOT NULL,
    "sinopsis" TEXT NOT NULL,
    "prediccion" DOUBLE PRECISION NOT NULL,
    "razonamiento" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalisisLibro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnalisisLibro_usuarioId_libroId_key" ON "AnalisisLibro"("usuarioId", "libroId");

-- AddForeignKey
ALTER TABLE "AnalisisLibro" ADD CONSTRAINT "AnalisisLibro_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalisisLibro" ADD CONSTRAINT "AnalisisLibro_libroId_fkey" FOREIGN KEY ("libroId") REFERENCES "Libro"("id") ON DELETE CASCADE ON UPDATE CASCADE;
