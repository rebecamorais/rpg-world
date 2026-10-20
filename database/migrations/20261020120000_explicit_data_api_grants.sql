-- A partir de 30/10/2026 o Supabase deixa de expor automaticamente tabelas novas
-- do schema public pela Data API (https://github.com/orgs/supabase/discussions/45329).
-- Tabelas já existentes em produção mantêm os grants, mas um banco recriado do zero
-- pelas migrations (dev, test, projeto novo) nasceria sem eles e o supabase-js
-- receberia 42501 "permission denied".
--
-- Esta migration torna explícitos os grants que as tabelas sempre tiveram (nenhuma
-- mudança de comportamento: quem filtra as linhas continua sendo o RLS) e adota já
-- o novo padrão, para que tabelas futuras precisem declarar os próprios grants.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.profile,
  public.characters,
  public.character_lore,
  public.spells,
  public.spell_translations,
  public.character_spells,
  public.feedback
TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES FROM anon, authenticated, service_role;
