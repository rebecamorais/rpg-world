-- Mesas (fase 2): o combate. Um por mesa, com rodada e turno atual, e os participantes em ordem.
--
-- - encounters: round 0 é "preparando" (o mestre monta a lista); start_encounter abre a rodada 1.
--   Sem UPDATE para ninguém: o turno só anda pelas funções da próxima migração. Encerrar o combate
--   apaga a linha.
-- - encounter_participants: personagens da mesa (side player) e fichas npc do mestre (side enemy).
--   O PV de cada inimigo fica aqui (três goblins, uma ficha); o PV de jogador fica na ficha dele, e
--   o mestre não muda.
-- - Só o mestre lê e escreve as duas tabelas. O jogador vê ordem, nomes e de quem é a vez por
--   encounter_turns (próxima migração), que não devolve iniciativa nem números.

-- 1. Tabelas
CREATE TABLE public.encounters (
  party_id                uuid         PRIMARY KEY REFERENCES public.parties (id) ON DELETE CASCADE,
  round                   int          NOT NULL DEFAULT 0 CHECK (round >= 0),
  -- Sem FK: os gatilhos abaixo mantêm o atual válido (e passam a vez quando ele sai)
  current_participant_id  uuid,
  created_at              timestamptz  NOT NULL DEFAULT now(),
  updated_at              timestamptz  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_encounters_updated_at
  BEFORE UPDATE ON public.encounters
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.encounter_participants (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id      uuid         NOT NULL REFERENCES public.encounters (party_id) ON DELETE CASCADE,
  character_id  uuid         NOT NULL REFERENCES public.characters (id) ON DELETE CASCADE,
  side          text         NOT NULL CHECK (side IN ('player', 'enemy')),
  -- Só inimigos têm rótulo ("Goblin 2"); o nome do jogador vem da ficha
  label         text         CHECK (label IS NULL OR char_length(btrim(label)) BETWEEN 1 AND 60),
  initiative    int          CHECK (initiative BETWEEN -10 AND 99),
  -- Quem entra vai para o fim (o gatilho de inserção escreve; o default só satisfaz o NOT NULL)
  position      int          NOT NULL DEFAULT 0,
  hp_current    int          CHECK (hp_current BETWEEN 0 AND 9999),
  hp_temp       int          CHECK (hp_temp BETWEEN 0 AND 9999),
  created_at    timestamptz  NOT NULL DEFAULT now(),
  CHECK ((side = 'enemy') = (label IS NOT NULL)),
  CHECK (side = 'enemy' OR (hp_current IS NULL AND hp_temp IS NULL)),
  CHECK (side = 'player' OR (hp_current IS NOT NULL AND hp_temp IS NOT NULL))
);
CREATE INDEX idx_encounter_participants_party_id ON public.encounter_participants (party_id);
CREATE INDEX idx_encounter_participants_character_id
  ON public.encounter_participants (character_id);
CREATE UNIQUE INDEX uq_encounter_participants_player
  ON public.encounter_participants (party_id, character_id) WHERE side = 'player';

-- 2. Quem vem depois na ordem. Sem ninguém depois, volta ao primeiro (wrapped = true: a rodada
--    vira). p_skip fica de fora (o participante que está saindo).
CREATE FUNCTION private.next_participant(p_party_id uuid, p_after int, p_skip uuid)
RETURNS TABLE (participant_id uuid, wrapped boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
    SELECT ep.id, false FROM public.encounter_participants AS ep
    WHERE ep.party_id = p_party_id AND ep.position > p_after AND ep.id IS DISTINCT FROM p_skip
    ORDER BY ep.position, ep.created_at
    LIMIT 1;
  IF FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT ep.id, true FROM public.encounter_participants AS ep
    WHERE ep.party_id = p_party_id AND ep.id IS DISTINCT FROM p_skip
    ORDER BY ep.position, ep.created_at
    LIMIT 1;
END;
$$;

-- 3. Gatilhos
-- Entra no fim da ordem; o inimigo começa com o PV máximo da ficha. No máximo 50 por combate (o
-- lock por mesa impede que duas adições ao mesmo tempo passem as duas pela contagem).
CREATE FUNCTION private.prepare_participant()
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
  IF NEW.side = 'enemy' THEN
    NEW.hp_current := coalesce(
      NEW.hp_current,
      (SELECT hp_max FROM public.characters WHERE id = NEW.character_id)
    );
    NEW.hp_temp := coalesce(NEW.hp_temp, 0);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_encounter_participants_prepare
  BEFORE INSERT ON public.encounter_participants
  FOR EACH ROW EXECUTE FUNCTION private.prepare_participant();

-- Quem sai na própria vez passa a vez ao próximo (e, se era o último, a rodada vira)
CREATE FUNCTION private.pass_turn_of_removed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current uuid;
  v_next uuid;
  v_wrapped boolean;
BEGIN
  SELECT current_participant_id INTO v_current
  FROM public.encounters WHERE party_id = OLD.party_id
  FOR UPDATE;
  -- Também cobre o combate sendo apagado (a linha já não está visível)
  IF v_current IS DISTINCT FROM OLD.id THEN
    RETURN OLD;
  END IF;

  SELECT n.participant_id, n.wrapped INTO v_next, v_wrapped
  FROM private.next_participant(OLD.party_id, OLD.position, OLD.id) AS n;
  UPDATE public.encounters
  SET current_participant_id = v_next,
      round = round + CASE WHEN v_wrapped THEN 1 ELSE 0 END
  WHERE party_id = OLD.party_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_encounter_participants_pass_turn
  BEFORE DELETE ON public.encounter_participants
  FOR EACH ROW EXECUTE FUNCTION private.pass_turn_of_removed();

-- O personagem que sai da mesa (ou é tirado dela) sai do combate
CREATE FUNCTION private.drop_participants_of_character()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.encounter_participants
  WHERE party_id = OLD.party_id AND character_id = OLD.character_id AND side = 'player';
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_party_characters_drop_participants
  AFTER DELETE ON public.party_characters
  FOR EACH ROW EXECUTE FUNCTION private.drop_participants_of_character();

-- Personagem apagado também sai dos combates (de qualquer lado)
CREATE OR REPLACE FUNCTION private.drop_deleted_character()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.party_characters WHERE character_id = NEW.id;
  DELETE FROM public.encounter_participants WHERE character_id = NEW.id;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION
  private.next_participant(uuid, int, uuid),
  private.prepare_participant(),
  private.pass_turn_of_removed(),
  private.drop_participants_of_character()
FROM PUBLIC, anon, authenticated;

-- 4. RLS: só o mestre
ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encounter_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "encounters_select_gm"
  ON public.encounters FOR SELECT
  USING (private.is_party_gm(party_id));

CREATE POLICY "encounters_insert_gm"
  ON public.encounters FOR INSERT
  WITH CHECK (private.is_party_gm(party_id));

CREATE POLICY "encounters_delete_gm"
  ON public.encounters FOR DELETE
  USING (private.is_party_gm(party_id));

CREATE POLICY "encounter_participants_select_gm"
  ON public.encounter_participants FOR SELECT
  USING (private.is_party_gm(party_id));

-- Jogador: um personagem levado a esta mesa. Inimigo: uma ficha npc do próprio mestre.
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
      OR (side = 'enemy' AND EXISTS (
        SELECT 1 FROM public.characters AS c
        WHERE c.id = encounter_participants.character_id
          AND c.owner_id = (SELECT auth.uid())
          AND c.kind = 'npc'
          AND c.deleted_at IS NULL
      ))
    )
  );

CREATE POLICY "encounter_participants_update_gm"
  ON public.encounter_participants FOR UPDATE
  USING (private.is_party_gm(party_id))
  WITH CHECK (private.is_party_gm(party_id));

CREATE POLICY "encounter_participants_delete_gm"
  ON public.encounter_participants FOR DELETE
  USING (private.is_party_gm(party_id));

-- 5. Grants (a migração 20261020130000 revoga por padrão)
REVOKE ALL ON TABLE public.encounters, public.encounter_participants
  FROM anon, authenticated, service_role;

GRANT SELECT, INSERT, DELETE ON TABLE public.encounters TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.encounter_participants TO authenticated;
GRANT UPDATE (label, initiative, hp_current, hp_temp)
  ON TABLE public.encounter_participants TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.encounters, public.encounter_participants
  TO service_role;
