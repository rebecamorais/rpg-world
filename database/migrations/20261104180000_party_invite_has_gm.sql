-- get_party_invite passa a dizer se a mesa tem mestre.
--
-- A página do link de convite precisa avisar que a mesa está sem mestre em vez de oferecer
-- "Pedir para entrar" (request_party_join recusa com party_without_gm, pois ninguém aprovaria). Só
-- o gm_username não diz isso: ele é nulo tanto na mesa sem mestre quanto no mestre que não escolheu
-- username, então has_gm separa os dois casos.
--
-- O tipo de retorno muda, por isso DROP e CREATE (CREATE OR REPLACE não aceita). Mesma definição de
-- 20261104123642_party_without_gm.sql, com a coluna nova e os mesmos grants.

DROP FUNCTION public.get_party_invite(text);

CREATE FUNCTION public.get_party_invite(p_code text)
RETURNS TABLE (party_id uuid, name text, gm_username text, my_status text, has_gm boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    p.id,
    p.name,
    CASE WHEN gm.username_chosen THEN gm.username END,
    CASE
      WHEN p.gm_id = (SELECT auth.uid()) THEN 'gm'
      ELSE (
        SELECT m.status FROM public.party_members AS m
        WHERE m.party_id = p.id AND m.user_id = (SELECT auth.uid())
      )
    END,
    p.gm_id IS NOT NULL
  FROM public.party_invites AS i
  JOIN public.parties AS p ON p.id = i.party_id
  LEFT JOIN public.profile AS gm ON gm.id = p.gm_id
  WHERE i.code = p_code;
$$;

REVOKE ALL ON FUNCTION public.get_party_invite(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_party_invite(text) TO authenticated, service_role;
