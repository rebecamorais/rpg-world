-- Combate (fase 2): começar, passar o turno, mudar a ordem e o que o jogador vê.
--
-- O turno só anda por aqui (encounters não tem UPDATE para ninguém). end_turn recebe o
-- participante que quem chama acha que é o atual: se a vez já passou (outro clique, outra tela),
-- falha em vez de andar de novo.

-- Abre a rodada 1 no primeiro da ordem. Só o mestre, e só na preparação.
CREATE FUNCTION public.start_encounter(p_party_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_round int;
  v_first uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('encounter:' || p_party_id::text));
  SELECT round INTO v_round FROM public.encounters WHERE party_id = p_party_id FOR UPDATE;
  IF v_round IS DISTINCT FROM 0 OR NOT private.is_party_gm(p_party_id) THEN
    RAISE EXCEPTION USING MESSAGE = 'encounter_not_found', ERRCODE = 'P0001';
  END IF;

  SELECT n.participant_id INTO v_first FROM private.next_participant(p_party_id, -1, NULL) AS n;
  IF v_first IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'encounter_empty', ERRCODE = 'P0001';
  END IF;

  UPDATE public.encounters SET round = 1, current_participant_id = v_first
  WHERE party_id = p_party_id;
END;
$$;

-- Encerra o turno de p_participant_id, se ainda for o atual. O mestre encerra o de qualquer um; o
-- jogador, só o de um personagem dele.
CREATE FUNCTION public.end_turn(p_party_id uuid, p_participant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_round int;
  v_current uuid;
  v_side text;
  v_position int;
  v_owner uuid;
  v_next uuid;
  v_wrapped boolean;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('encounter:' || p_party_id::text));
  SELECT round, current_participant_id INTO v_round, v_current
  FROM public.encounters WHERE party_id = p_party_id
  FOR UPDATE;
  IF coalesce(v_round, 0) = 0 OR v_current IS DISTINCT FROM p_participant_id THEN
    RAISE EXCEPTION USING MESSAGE = 'encounter_not_your_turn', ERRCODE = 'P0001';
  END IF;

  SELECT ep.side, ep.position, c.owner_id INTO v_side, v_position, v_owner
  FROM public.encounter_participants AS ep
  JOIN public.characters AS c ON c.id = ep.character_id
  WHERE ep.id = p_participant_id;
  IF NOT (
    private.is_party_gm(p_party_id)
    OR (v_side = 'player' AND v_owner = v_uid AND private.is_party_member(p_party_id))
  ) THEN
    RAISE EXCEPTION USING MESSAGE = 'encounter_not_your_turn', ERRCODE = 'P0001';
  END IF;

  SELECT n.participant_id, n.wrapped INTO v_next, v_wrapped
  FROM private.next_participant(p_party_id, v_position, NULL) AS n;
  UPDATE public.encounters
  SET current_participant_id = v_next,
      round = round + CASE WHEN v_wrapped THEN 1 ELSE 0 END
  WHERE party_id = p_party_id;
END;
$$;

-- Regrava a ordem. A lista precisa ter exatamente os participantes do combate, cada um uma vez.
CREATE FUNCTION public.set_encounter_order(p_party_id uuid, p_participant_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_total int;
  v_matching int;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('encounter:' || p_party_id::text));
  IF NOT private.is_party_gm(p_party_id) THEN
    RAISE EXCEPTION USING MESSAGE = 'encounter_not_found', ERRCODE = 'P0001';
  END IF;

  SELECT count(*) INTO v_total FROM public.encounter_participants WHERE party_id = p_party_id;
  SELECT count(*) INTO v_matching FROM public.encounter_participants
  WHERE party_id = p_party_id AND id = ANY (p_participant_ids);
  IF v_total = 0
    OR cardinality(p_participant_ids) <> v_total
    OR v_matching <> v_total
    OR (SELECT count(DISTINCT id) FROM unnest(p_participant_ids) AS id) <> v_total
  THEN
    RAISE EXCEPTION USING MESSAGE = 'encounter_not_found', ERRCODE = 'P0001';
  END IF;

  UPDATE public.encounter_participants AS ep
  SET position = o.ord
  FROM unnest(p_participant_ids) WITH ORDINALITY AS o (id, ord)
  WHERE ep.id = o.id;
END;
$$;

-- O que o jogador vê: a rodada, a ordem com os nomes, de quem é a vez e quais são dele. Sem
-- iniciativa, PV nem CA. Para o mestre e os membros ativos; os outros recebem zero linhas. Sem
-- combate, zero linhas; preparando sem ninguém, uma linha só com a rodada.
CREATE FUNCTION public.encounter_turns(p_party_id uuid)
RETURNS TABLE (round int, participant_id uuid, name text, is_current boolean, is_mine boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    e.round,
    ep.id,
    coalesce(ep.label, c.name),
    CASE WHEN ep.id IS NOT NULL THEN coalesce(ep.id = e.current_participant_id, false) END,
    CASE WHEN ep.id IS NOT NULL THEN ep.side = 'player' AND c.owner_id = (SELECT auth.uid()) END
  FROM public.encounters AS e
  LEFT JOIN public.encounter_participants AS ep ON ep.party_id = e.party_id
  LEFT JOIN public.characters AS c ON c.id = ep.character_id
  WHERE e.party_id = p_party_id
    AND (private.is_party_gm(p_party_id) OR private.is_party_member(p_party_id))
  ORDER BY ep.position, ep.created_at;
$$;

REVOKE ALL ON FUNCTION
  public.start_encounter(uuid),
  public.end_turn(uuid, uuid),
  public.set_encounter_order(uuid, uuid[]),
  public.encounter_turns(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.start_encounter(uuid),
  public.end_turn(uuid, uuid),
  public.set_encounter_order(uuid, uuid[]),
  public.encounter_turns(uuid)
TO authenticated, service_role;
