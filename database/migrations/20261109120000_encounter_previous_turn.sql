-- Combate: o mestre volta o turno (desfazer um "encerrar turno" apertado sem querer).
--
-- - previous_participant é o espelho de next_participant: o de maior posição antes de p_before,
--   pulando o morto revelado; se não houver, dá a volta para o último (wrapped). Se só sobrar morto
--   revelado, repete as buscas sem o filtro, para nunca travar.
-- - previous_turn: só o mestre, com o combate começado e alguém com a vez. Voltar de antes do
--   primeiro diminui a rodada; na rodada 1 não há para onde voltar: encounter_at_start.
-- - Mesmo lock de end_turn: um voltar e um encerrar ao mesmo tempo não se atropelam.

CREATE FUNCTION private.previous_participant(p_party_id uuid, p_before int)
RETURNS TABLE (participant_id uuid, wrapped boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
    SELECT ep.id, false FROM public.encounter_participants AS ep
    WHERE ep.party_id = p_party_id AND ep.position < p_before
      AND NOT ep.death_revealed
    ORDER BY ep.position DESC, ep.created_at DESC
    LIMIT 1;
  IF FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT ep.id, true FROM public.encounter_participants AS ep
    WHERE ep.party_id = p_party_id
      AND NOT ep.death_revealed
    ORDER BY ep.position DESC, ep.created_at DESC
    LIMIT 1;
  IF FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT ep.id, false FROM public.encounter_participants AS ep
    WHERE ep.party_id = p_party_id AND ep.position < p_before
    ORDER BY ep.position DESC, ep.created_at DESC
    LIMIT 1;
  IF FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT ep.id, true FROM public.encounter_participants AS ep
    WHERE ep.party_id = p_party_id
    ORDER BY ep.position DESC, ep.created_at DESC
    LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION private.previous_participant(uuid, int) FROM PUBLIC, anon, authenticated;

-- Volta a vez para quem veio antes. Só o mestre.
CREATE FUNCTION public.previous_turn(p_party_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_round int;
  v_current uuid;
  v_position int;
  v_previous uuid;
  v_wrapped boolean;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('encounter:' || p_party_id::text));
  SELECT round, current_participant_id INTO v_round, v_current
  FROM public.encounters WHERE party_id = p_party_id
  FOR UPDATE;
  -- Non-GMs get the same answer as a missing combat: they can't learn whether one is running
  IF NOT private.is_party_gm(p_party_id) OR coalesce(v_round, 0) = 0 THEN
    RAISE EXCEPTION USING MESSAGE = 'encounter_not_found', ERRCODE = 'P0001';
  END IF;
  IF v_current IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'encounter_not_your_turn', ERRCODE = 'P0001';
  END IF;

  SELECT ep.position INTO v_position
  FROM public.encounter_participants AS ep WHERE ep.id = v_current;

  SELECT p.participant_id, p.wrapped INTO v_previous, v_wrapped
  FROM private.previous_participant(p_party_id, v_position) AS p;
  IF v_wrapped AND v_round = 1 THEN
    RAISE EXCEPTION USING MESSAGE = 'encounter_at_start', ERRCODE = 'P0001';
  END IF;

  UPDATE public.encounters
  SET current_participant_id = v_previous,
      round = round - CASE WHEN v_wrapped THEN 1 ELSE 0 END
  WHERE party_id = p_party_id;
END;
$$;

REVOKE ALL ON FUNCTION public.previous_turn(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.previous_turn(uuid) TO authenticated, service_role;
