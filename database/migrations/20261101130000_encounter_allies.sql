-- NPC aliado no combate: uma ficha npc do mestre do lado dos jogadores (um guarda, um guia).
-- Fica como o inimigo: rótulo e PV próprios no participante, e só o mestre passa a vez dele. A
-- visão do jogador (encounter_turns) não muda: ela já não diz de que lado cada um está.

-- 1. O lado 'ally', com as mesmas regras do 'enemy'
ALTER TABLE public.encounter_participants
  DROP CONSTRAINT encounter_participants_side_check,
  DROP CONSTRAINT encounter_participants_check,
  DROP CONSTRAINT encounter_participants_check1,
  DROP CONSTRAINT encounter_participants_check2;

ALTER TABLE public.encounter_participants
  ADD CONSTRAINT encounter_participants_side_check
    CHECK (side IN ('player', 'ally', 'enemy')),
  -- Só npc tem rótulo ("Goblin 2"); o nome do jogador vem da ficha
  ADD CONSTRAINT encounter_participants_label_by_side
    CHECK ((side <> 'player') = (label IS NOT NULL)),
  -- O PV de jogador fica na ficha; o de npc, no participante
  ADD CONSTRAINT encounter_participants_hp_by_side
    CHECK (
      CASE WHEN side = 'player' THEN hp_current IS NULL AND hp_temp IS NULL
           ELSE hp_current IS NOT NULL AND hp_temp IS NOT NULL END
    );

-- 2. O npc (aliado ou inimigo) começa com o PV máximo da ficha
CREATE OR REPLACE FUNCTION private.prepare_participant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count int;
  v_last int;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('encounter:' || NEW.party_id::text));
  SELECT count(*), max(position) INTO v_count, v_last
  FROM public.encounter_participants WHERE party_id = NEW.party_id;
  IF v_count >= 50 THEN
    RAISE EXCEPTION USING MESSAGE = 'encounter_full', ERRCODE = 'P0001';
  END IF;

  NEW.position := coalesce(v_last, 0) + 1;
  IF NEW.side <> 'player' THEN
    NEW.hp_current := coalesce(
      NEW.hp_current,
      (SELECT hp_max FROM public.characters WHERE id = NEW.character_id)
    );
    NEW.hp_temp := coalesce(NEW.hp_temp, 0);
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Jogador: um personagem levado a esta mesa. Aliado ou inimigo: uma ficha npc do mestre.
DROP POLICY "encounter_participants_insert_gm" ON public.encounter_participants;

CREATE POLICY "encounter_participants_insert_gm"
  ON public.encounter_participants FOR INSERT
  WITH CHECK (
    private.is_party_gm(party_id)
    AND (
      (side = 'player' AND EXISTS (
        SELECT 1 FROM public.party_characters AS pc
        WHERE pc.party_id = encounter_participants.party_id
          AND pc.character_id = encounter_participants.character_id
      ))
      OR (side IN ('ally', 'enemy') AND EXISTS (
        SELECT 1 FROM public.characters AS c
        WHERE c.id = encounter_participants.character_id
          AND c.owner_id = (SELECT auth.uid())
          AND c.kind = 'npc'
          AND c.deleted_at IS NULL
      ))
    )
  );
