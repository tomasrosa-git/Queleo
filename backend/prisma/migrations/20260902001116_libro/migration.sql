-- CreateTable
CREATE TABLE "Libro" (
    "id" TEXT NOT NULL,
    "googleBooksId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "autores" TEXT[],
    "isbn" TEXT,
    "portadaUrl" TEXT,
    "anioPublicacion" INTEGER,
    "paginas" INTEGER,
    "cacheadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Libro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Libro_googleBooksId_key" ON "Libro"("googleBooksId");
