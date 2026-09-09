-- Supabase concede GRANT ALL sobre todo lo que se cree en el schema public a
-- los roles anon y authenticated, que son los que atiende su API REST
-- (PostgREST). Prisma creó las tablas ahí sin saberlo, así que cualquiera con
-- la anon key —que es pública por diseño— podía leer User.passwordHash y
-- RefreshToken.tokenHash, o vaciar las tablas.
--
-- Queleo no usa la API de Supabase: el único que toca la base es el backend,
-- que conecta como postgres (owner de las tablas y con BYPASSRLS), así que
-- revocar estos permisos y activar RLS no le afecta.

REVOKE ALL ON ALL TABLES IN SCHEMA "public" FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA "public" FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA "public" FROM anon, authenticated;
REVOKE USAGE ON SCHEMA "public" FROM anon, authenticated;

-- Sin esto, cada tabla que agregue una migración futura vuelve a nacer con
-- GRANT ALL para anon.
ALTER DEFAULT PRIVILEGES IN SCHEMA "public" REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- Los permisos revocados ya alcanzan, pero RLS es la segunda barrera y es lo
-- que mira el Security Advisor de Supabase. Sin políticas, deniega todo salvo
-- para quien la bypasea.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RefreshToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Libro" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EntradaBiblioteca" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PerfilLector" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MensajeOnboarding" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConsumoGemini" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Recomendacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalisisLibro" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
