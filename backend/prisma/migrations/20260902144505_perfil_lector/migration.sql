-- CreateEnum
CREATE TYPE "RolMensaje" AS ENUM ('USUARIO', 'ASISTENTE');

-- CreateTable
CREATE TABLE "PerfilLector" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "resumen" TEXT NOT NULL,
    "generos" TEXT[],
    "autores" TEXT[],
    "patrones" TEXT[],
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerfilLector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensajeOnboarding" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "rol" "RolMensaje" NOT NULL,
    "contenido" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MensajeOnboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumoGemini" (
    "fecha" TEXT NOT NULL,
    "llamados" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ConsumoGemini_pkey" PRIMARY KEY ("fecha")
);

-- CreateIndex
CREATE UNIQUE INDEX "PerfilLector_usuarioId_key" ON "PerfilLector"("usuarioId");

-- CreateIndex
CREATE INDEX "MensajeOnboarding_usuarioId_creadoEn_idx" ON "MensajeOnboarding"("usuarioId", "creadoEn");

-- AddForeignKey
ALTER TABLE "PerfilLector" ADD CONSTRAINT "PerfilLector_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensajeOnboarding" ADD CONSTRAINT "MensajeOnboarding_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
