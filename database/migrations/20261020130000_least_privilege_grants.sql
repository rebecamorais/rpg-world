-- Privilégio mínimo nas tabelas e funções do schema public.
-- Até aqui anon e authenticated tinham SELECT/INSERT/UPDATE/DELETE (e TRUNCATE,
-- REFERENCES, TRIGGER) em todas as tabelas, e só o RLS segurava. Agora cada papel
-- recebe apenas o que o app usa; uma policy errada no futuro não abre a tabela sozinha.
--
-- Quem acessa o quê:
--   anon          -> só lê o catálogo de magias (busca sem sessão).
--   authenticated -> as próprias linhas, filtradas pelo RLS.
--   service_role  -> feedback e operações administrativas (ignora RLS).

REVOKE ALL ON TABLE
  public.profile,
  public.characters,
  public.character_lore,
  public.spells,
  public.spell_translations,
  public.character_spells,
  public.feedback
FROM anon, authenticated, service_role;

-- Catálogo de magias: leitura pública.
GRANT SELECT ON TABLE public.spells, public.spell_translations TO anon, authenticated;

-- Dados do usuário: as operações que as policies permitem.
GRANT SELECT, INSERT, UPDATE ON TABLE public.profile TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.characters,
  public.character_lore,
  public.character_spells
TO authenticated;

-- feedback: nenhum acesso pela chave pública nem pelo usuário logado.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.profile,
  public.characters,
  public.character_lore,
  public.spells,
  public.spell_translations,
  public.character_spells,
  public.feedback
TO service_role;

-- Funções de trigger: ninguém precisa chamá-las pela API.
-- handle_updated_at só mexe na linha que já está sendo atualizada, então não
-- precisa de SECURITY DEFINER. handle_new_user precisa (grava em public.profile a
-- partir do schema auth), mas passa a usar search_path vazio; os nomes já são
-- qualificados e as funções usadas vêm de pg_catalog.
ALTER FUNCTION public.handle_updated_at() SECURITY INVOKER;
ALTER FUNCTION public.handle_updated_at() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';

REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Funções novas também nascem sem EXECUTE para a API; quem precisar concede.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
