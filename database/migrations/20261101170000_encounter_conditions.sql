-- Condições no combate (caído, envenenado, exaustão 3) e a edição das regras da mesa.
--
-- - parties.edition: '2014' (SRD 5.1) ou '2024' (SRD 5.2), a edição que a mesa usa por padrão.
--   O mestre troca (a política parties_update_gm já limita a ele).
-- - encounter_participants.conditions: a lista de condições de cada participante, como chaves de
--   conteúdo ('dnd5e:srd-5.2:condition:prone') e o nível (só a exaustão tem). Sem grant de UPDATE
--   na coluna: só set_participant_conditions escreve, e ela deixa o jogador mexer no próprio
--   personagem, o que a política de UPDATE (só o mestre) não deixaria.
-- - encounter_turns passa a devolver as condições: todos na mesa veem quem está caído.
-- - O aviso em tempo real já sai: trg_encounter_participants_notify cobre UPDATE.

-- 1. Edição da mesa
ALTER TABLE public.parties
  ADD COLUMN edition text NOT NULL DEFAULT '2024' CHECK (edition IN ('2014', '2024'));

GRANT UPDATE (edition) ON TABLE public.parties TO authenticated;

-- 2. Formato das condições: um array de até 20 objetos { key, level }, sem chave repetida. A key
--    é uma condição do SRD 5.1 ou 5.2; o level é null (ou ausente) ou um inteiro de 1 a 6. Nada
--    além de key e level no objeto.
CREATE FUNCTION private.valid_conditions(p_conditions jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v_item jsonb;
BEGIN
  IF p_conditions IS NULL
    OR jsonb_typeof(p_conditions) <> 'array'
    OR jsonb_array_length(p_conditions) > 20
  THEN
    RETURN false;
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_conditions) LOOP
    IF jsonb_typeof(v_item) <> 'object'
      OR EXISTS (
        SELECT 1 FROM jsonb_object_keys(v_item) AS k
        WHERE k NOT IN ('key', 'level')
      )
      OR coalesce(jsonb_typeof(v_item -> 'key'), '') <> 'string'
      OR (v_item ->> 'key') !~ '^dnd5e:srd-5\.[12]:condition:[a-z0-9-]+$'
      OR NOT (
        coalesce(jsonb_typeof(v_item -> 'level'), 'null') = 'null'
        OR (jsonb_typeof(v_item -> 'level') = 'number' AND (v_item ->> 'level') ~ '^[1-6]$')
      )
    THEN
      RETURN false;
    END IF;
  END LOOP;

  RETURN (SELECT count(DISTINCT value ->> 'key') FROM jsonb_array_elements(p_conditions))
    = jsonb_array_length(p_conditions);
END;
$$;

-- O CHECK roda com quem insere (o mestre, ao pôr alguém no combate) e com o service_role
REVOKE ALL ON FUNCTION private.valid_conditions(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.valid_conditions(jsonb) TO authenticated, service_role;

-- 3. As condições de cada participante
ALTER TABLE public.encounter_participants
  ADD COLUMN conditions jsonb NOT NULL DEFAULT '[]'::jsonb
    CONSTRAINT encounter_participants_conditions_valid
    CHECK (private.valid_conditions(conditions));

-- 4. Quem muda as condições: o mestre, em qualquer participante; o jogador, no personagem dele que
--    ainda está na mesa (sair de party_characters já tira do combate, mas a função não confia
--    nisso). Devolve false, sem dizer por quê, quando o participante não é desta mesa ou quem
--    chama não pode; true quando gravou. Formato inválido falha pelo CHECK (23514).
CREATE FUNCTION public.set_participant_conditions(
  p_party_id uuid,
  p_participant_id uuid,
  p_conditions jsonb
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
  SELECT ep.side, ep.character_id, c.owner_id INTO v_side, v_character, v_owner
  FROM public.encounter_participants AS ep
  JOIN public.characters AS c ON c.id = ep.character_id
  WHERE ep.id = p_participant_id AND ep.party_id = p_party_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF NOT (
    private.is_party_gm(p_party_id)
    OR (
      v_side = 'player'
      AND v_uid IS NOT NULL
      AND v_owner = v_uid
      AND private.is_party_member(p_party_id)
      AND EXISTS (
        SELECT 1 FROM public.party_characters AS pc
        WHERE pc.party_id = p_party_id AND pc.character_id = v_character
      )
    )
  ) THEN
    RETURN false;
  END IF;

  UPDATE public.encounter_participants
  SET conditions = p_conditions
  WHERE id = p_participant_id AND party_id = p_party_id;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.set_participant_conditions(uuid, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_participant_conditions(uuid, uuid, jsonb)
  TO authenticated, service_role;

-- 5. encounter_turns com as condições no fim (null na linha "preparando sem ninguém"). Mudar o
--    tipo de retorno pede DROP + CREATE; nada no banco depende dela.
DROP FUNCTION public.encounter_turns(uuid);

CREATE FUNCTION public.encounter_turns(p_party_id uuid)
RETURNS TABLE (
  round int,
  participant_id uuid,
  name text,
  is_current boolean,
  is_mine boolean,
  conditions jsonb
)
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
    CASE WHEN ep.id IS NOT NULL THEN ep.side = 'player' AND c.owner_id = (SELECT auth.uid()) END,
    ep.conditions
  FROM public.encounters AS e
  LEFT JOIN public.encounter_participants AS ep ON ep.party_id = e.party_id
  LEFT JOIN public.characters AS c ON c.id = ep.character_id
  WHERE e.party_id = p_party_id
    AND (private.is_party_gm(p_party_id) OR private.is_party_member(p_party_id))
  ORDER BY ep.position, ep.created_at;
$$;

REVOKE ALL ON FUNCTION public.encounter_turns(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.encounter_turns(uuid) TO authenticated, service_role;
