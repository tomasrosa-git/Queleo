-- CreateTable
CREATE TABLE "Recomendacion" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "libroId" TEXT NOT NULL,
    "razonamiento" TEXT NOT NULL,
    "reparo" TEXT,
    "orden" INTEGER NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recomendacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Recomendacion_usuarioId_orden_idx" ON "Recomendacion"("usuarioId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "Recomendacion_usuarioId_libroId_key" ON "Recomendacion"("usuarioId", "libroId");

-- AddForeignKey
ALTER TABLE "Recomendacion" ADD CONSTRAINT "Recomendacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recomendacion" ADD CONSTRAINT "Recomendacion_libroId_fkey" FOREIGN KEY ("libroId") REFERENCES "Libro"("id") ON DELETE CASCADE ON UPDATE CASCADE;
