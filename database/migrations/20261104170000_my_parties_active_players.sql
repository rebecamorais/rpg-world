-- my_parties passa a dizer quantos jogadores ativos a mesa tem e se ela tem mestre.
--
-- A tela de exclusão de conta precisa saber, antes de a pessoa confirmar, quais mesas dela ficam
-- sem mestre (têm jogadores ativos) e quais são apagadas (não têm), e em quais mesas sem mestre
-- ela é a última jogadora ativa. Só a lista não diz isso: a mesa sem mestre aparece como 'player'
-- com gm_username nulo, e o mestre que não escolheu username também tem gm_username nulo, então
-- has_gm separa os dois casos.
--
-- O tipo de retorno muda, por isso DROP e CREATE (CREATE OR REPLACE não aceita). Mesma definição de
-- 20261104123642_party_without_gm.sql, com as duas colunas novas e os mesmos grants.

DROP FUNCTION public.my_parties();

CREATE FUNCTION public.my_parties()
RETURNS TABLE (
  party_id uuid,
  name text,
  system text,
  role text,
  status text,
  gm_username text,
  pending_requests int,
  active_players int,
  has_gm boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT * FROM (
    SELECT
      p.id,
      p.name,
      p.system::text,
      'gm',
      'gm',
      CASE WHEN gm.username_chosen THEN gm.username END,
      (
        SELECT count(*)::int FROM public.party_members AS r
        WHERE r.party_id = p.id AND r.status = 'requested'
      ),
      (
        SELECT count(*)::int FROM public.party_members AS a
        WHERE a.party_id = p.id AND a.status = 'active'
      ),
      true
    FROM public.parties AS p
    JOIN public.profile AS gm ON gm.id = p.gm_id
    WHERE p.gm_id = (SELECT auth.uid())
    UNION ALL
    SELECT
      p.id,
      p.name,
      p.system::text,
      'player',
      m.status,
      CASE WHEN gm.username_chosen THEN gm.username END,
      0,
      (
        SELECT count(*)::int FROM public.party_members AS a
        WHERE a.party_id = p.id AND a.status = 'active'
      ),
      p.gm_id IS NOT NULL
    FROM public.party_members AS m
    JOIN public.parties AS p ON p.id = m.party_id
    LEFT JOIN public.profile AS gm ON gm.id = p.gm_id
    WHERE m.user_id = (SELECT auth.uid())
  ) AS mine (
    party_id, name, system, role, status, gm_username, pending_requests, active_players, has_gm
  )
  ORDER BY name, party_id;
$$;

REVOKE ALL ON FUNCTION public.my_parties() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.my_parties() TO authenticated, service_role;
