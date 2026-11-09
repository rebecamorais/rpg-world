-- Combate: o jogador escreve a própria iniciativa e a lista mostra o @ de cada jogador.
--
-- - set_my_initiative: o jogador muda a iniciativa do personagem dele que está na mesa, em qualquer
--   rodada (inclusive a 0, na própria vez e com 0 PV). O mestre continua pela coluna (a política de
--   UPDATE é só dele), então aqui não há atalho do mestre.
-- - encounter_turns ganha três colunas no fim: a iniciativa e o id do personagem só na linha de
--   quem chama (ninguém vê a iniciativa dos outros) e o @ do dono só em linha de jogador que
--   escolheu o username (o aleatório não sai).

-- 1. Quem muda a iniciativa: só o dono do personagem jogador, membro ativo, com o personagem levado
--    à mesa (sair de party_characters já tira do combate, mas a função não confia nisso). Devolve
--    false, sem dizer por quê, em qualquer outro caso; true quando gravou. Aceita null (limpar).
--    Fora de -10..99 falha pelo CHECK da coluna (23514).
CREATE FUNCTION public.set_my_initiative(
  p_party_id uuid,
  p_participant_id uuid,
  p_initiative int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_side text;
  v_character uuid;
  v_owner uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT ep.side, ep.character_id, c.owner_id INTO v_side, v_character, v_owner
  FROM public.encounter_participants AS ep
  JOIN public.characters AS c ON c.id = ep.character_id
  WHERE ep.id = p_participant_id AND ep.party_id = p_party_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF NOT (
    v_side = 'player'
    AND v_owner = v_uid
    AND private.is_party_member(p_party_id)
    AND EXISTS (
      SELECT 1 FROM public.party_characters AS pc
      WHERE pc.party_id = p_party_id AND pc.character_id = v_character
    )
  ) THEN
    RETURN false;
  END IF;

  UPDATE public.encounter_participants
  SET initiative = p_initiative
  WHERE id = p_participant_id AND party_id = p_party_id;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.set_my_initiative(uuid, uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_my_initiative(uuid, uuid, int)
  TO authenticated, service_role;

-- 2. encounter_turns como em 20261107120000_encounter_visibility.sql §8 (oculto filtrado no JOIN,
--    anônimo sem nome nem imagem, vida resumida, hidden_turn), mais initiative e character_id só
--    onde is_mine e owner_username só em linha de jogador com username escolhido. Mudar o tipo de
--    retorno pede DROP + CREATE.
DROP FUNCTION public.encounter_turns(uuid);

CREATE FUNCTION public.encounter_turns(p_party_id uuid)
RETURNS TABLE (
  round int,
  participant_id uuid,
  side text,
  name text,
  avatar_url text,
  life text,
  is_current boolean,
  is_mine boolean,
  conditions jsonb,
  hidden_turn boolean,
  initiative int,
  character_id uuid,
  owner_username text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    e.round,
    ep.id,
    ep.side,
    CASE WHEN ep.visibility = 'anonymous' THEN NULL ELSE coalesce(ep.label, c.name) END,
    CASE WHEN ep.side = 'player' OR ep.visibility = 'visible' THEN c.avatar_url END,
    CASE
      WHEN ep.id IS NULL THEN NULL
      WHEN ep.side = 'player' OR ep.hp_current > 0 THEN 'normal'
      WHEN ep.death_revealed THEN 'dead'
      ELSE 'down'
    END,
    CASE WHEN ep.id IS NOT NULL THEN coalesce(ep.id = e.current_participant_id, false) END,
    CASE WHEN ep.id IS NOT NULL THEN ep.side = 'player' AND c.owner_id = (SELECT auth.uid()) END,
    ep.conditions,
    EXISTS (
      SELECT 1 FROM public.encounter_participants AS cur
      WHERE cur.id = e.current_participant_id AND cur.visibility = 'hidden'
    ),
    CASE WHEN ep.side = 'player' AND c.owner_id = (SELECT auth.uid()) THEN ep.initiative END,
    CASE WHEN ep.side = 'player' AND c.owner_id = (SELECT auth.uid()) THEN ep.character_id END,
    CASE WHEN ep.side = 'player' AND pr.username_chosen THEN pr.username END
  FROM public.encounters AS e
  LEFT JOIN public.encounter_participants AS ep
    ON ep.party_id = e.party_id AND ep.visibility <> 'hidden'
  LEFT JOIN public.characters AS c ON c.id = ep.character_id
  LEFT JOIN public.profile AS pr ON pr.id = c.owner_id
  WHERE e.party_id = p_party_id
    AND (private.is_party_gm(p_party_id) OR private.is_party_member(p_party_id))
  ORDER BY ep.position, ep.created_at;
$$;

REVOKE ALL ON FUNCTION public.encounter_turns(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.encounter_turns(uuid) TO authenticated, service_role;
