-- Combate: o que os jogadores veem de cada NPC, o lado neutro e o NPC caído ou morto.
--
-- - side ganha 'neutral' (um mercador, um refém): npc como o aliado e o inimigo, com rótulo e PV
--   próprios. Jogador continua jogador e npc continua npc: trocar entre os dois falha com
--   encounter_invalid_change (o PV e o rótulo de cada um ficam em lugares diferentes).
-- - visibility: 'visible' (nome e lado), 'anonymous' (está lá, sem nome) ou 'hidden' (não aparece
--   para os jogadores). NPC novo entra oculto, para o mestre montar o combate sem estragar a
--   surpresa; as linhas que já existem ficam visíveis, como eram. Jogador é sempre visível.
-- - npc_fate: null (de pé), 'death_saves' (caído, fazendo testes contra a morte) ou 'dead'. Só com
--   0 PV; curar volta a null e zera os testes. Três falhas viram 'dead' sozinhas.
-- - death_revealed: o mestre contou aos jogadores que o NPC morreu. Só vale com 'dead'. O morto
--   revelado sai da vez (next_participant pula), menos quando não sobra ninguém: aí o turno anda
--   como antes, para o combate nunca travar.
-- - Só o mestre muda essas colunas: a política de UPDATE já é só dele.

-- 1. As colunas novas. visibility entra com 'visible' para preencher as linhas atuais, e depois o
--    padrão passa a 'hidden'.
ALTER TABLE public.encounter_participants
  ADD COLUMN visibility text NOT NULL DEFAULT 'visible'
    CONSTRAINT encounter_participants_visibility_check
    CHECK (visibility IN ('visible', 'anonymous', 'hidden')),
  ADD COLUMN npc_fate text
    CONSTRAINT encounter_participants_npc_fate_check
    CHECK (npc_fate IN ('death_saves', 'dead')),
  ADD COLUMN death_successes int NOT NULL DEFAULT 0
    CONSTRAINT encounter_participants_death_successes_check
    CHECK (death_successes BETWEEN 0 AND 3),
  ADD COLUMN death_failures int NOT NULL DEFAULT 0
    CONSTRAINT encounter_participants_death_failures_check
    CHECK (death_failures BETWEEN 0 AND 3),
  ADD COLUMN death_revealed boolean NOT NULL DEFAULT false;

ALTER TABLE public.encounter_participants ALTER COLUMN visibility SET DEFAULT 'hidden';

-- 2. O lado neutro e as regras entre as colunas
ALTER TABLE public.encounter_participants
  DROP CONSTRAINT encounter_participants_side_check;

ALTER TABLE public.encounter_participants
  ADD CONSTRAINT encounter_participants_side_check
    CHECK (side IN ('player', 'ally', 'neutral', 'enemy')),
  -- Jogador é sempre visível e não tem destino nem testes aqui (os dele ficam na ficha)
  ADD CONSTRAINT encounter_participants_player_plain
    CHECK (
      side <> 'player'
      OR (
        visibility = 'visible'
        AND npc_fate IS NULL
        AND death_successes = 0
        AND death_failures = 0
        AND NOT death_revealed
      )
    ),
  ADD CONSTRAINT encounter_participants_fate_needs_zero_hp
    CHECK (npc_fate IS NULL OR hp_current = 0),
  ADD CONSTRAINT encounter_participants_revealed_needs_dead
    CHECK (NOT death_revealed OR npc_fate = 'dead');

-- 3. Jogador entra visível, peça o que pedir; o resto continua como era
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
  IF NEW.side = 'player' THEN
    NEW.visibility := 'visible';
  ELSE
    NEW.hp_current := coalesce(
      NEW.hp_current,
      (SELECT hp_max FROM public.characters WHERE id = NEW.character_id)
    );
    NEW.hp_temp := coalesce(NEW.hp_temp, 0);
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Ao mudar um participante: jogador não vira npc nem o contrário; NPC com PV sai do chão (sem
--    destino, testes nem revelação); desfazer morto ou limpar o destino zera os testes; três falhas matam; só o morto fica revelado.
CREATE FUNCTION private.guard_participant_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (OLD.side = 'player') <> (NEW.side = 'player') THEN
    RAISE EXCEPTION USING MESSAGE = 'encounter_invalid_change', ERRCODE = 'P0001';
  END IF;

  IF NEW.side <> 'player' AND NEW.hp_current > 0 THEN
    NEW.npc_fate := NULL;
    NEW.death_successes := 0;
    NEW.death_failures := 0;
    NEW.death_revealed := false;
  END IF;

  -- Desfazer "morto" (ou limpar o destino) recomeça os testes; senão as 3 falhas matariam de novo
  IF (OLD.npc_fate = 'dead' AND NEW.npc_fate IS DISTINCT FROM 'dead') OR (NEW.side <> 'player' AND NEW.npc_fate IS NULL) THEN
    NEW.death_successes := 0;
    NEW.death_failures := 0;
  END IF;

  IF NEW.npc_fate = 'death_saves' AND NEW.death_failures >= 3 THEN
    NEW.npc_fate := 'dead';
  END IF;

  IF NEW.npc_fate IS DISTINCT FROM 'dead' THEN
    NEW.death_revealed := false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_encounter_participants_guard_update
  BEFORE UPDATE ON public.encounter_participants
  FOR EACH ROW EXECUTE FUNCTION private.guard_participant_update();

-- 5. Quem vem depois pula o morto revelado. Se só sobrar morto revelado (ou ninguém além de
--    p_skip), cai nas buscas de antes, sem o filtro.
CREATE OR REPLACE FUNCTION private.next_participant(p_party_id uuid, p_after int, p_skip uuid)
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
      AND NOT ep.death_revealed
    ORDER BY ep.position, ep.created_at
    LIMIT 1;
  IF FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT ep.id, true FROM public.encounter_participants AS ep
    WHERE ep.party_id = p_party_id AND ep.id IS DISTINCT FROM p_skip
      AND NOT ep.death_revealed
    ORDER BY ep.position, ep.created_at
    LIMIT 1;
  IF FOUND THEN
    RETURN;
  END IF;

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

REVOKE ALL ON FUNCTION
  private.next_participant(uuid, int, uuid),
  private.prepare_participant(),
  private.guard_participant_update()
FROM PUBLIC, anon, authenticated;

-- 6. Neutro entra como aliado e inimigo: uma ficha npc do mestre
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
      OR (side IN ('ally', 'neutral', 'enemy') AND EXISTS (
        SELECT 1 FROM public.characters AS c
        WHERE c.id = encounter_participants.character_id
          AND c.owner_id = (SELECT auth.uid())
          AND c.kind = 'npc'
          AND c.deleted_at IS NULL
      ))
    )
  );

-- 7. O mestre muda o lado e as colunas novas (a política de UPDATE já é só dele)
GRANT UPDATE (side, visibility, npc_fate, death_successes, death_failures, death_revealed)
  ON TABLE public.encounter_participants TO authenticated;

-- 8. encounter_turns devolve só o que o jogador pode ver. O oculto não sai (o filtro fica no JOIN,
--    para a linha "só a rodada" continuar saindo quando ninguém é visível); o anônimo sai sem nome
--    e sem imagem; ninguém recebe PV, testes nem destino, só a vida resumida ('normal', 'down' ou
--    'dead', este só depois de o mestre revelar). Na vez de um oculto ninguém é o atual e todas as
--    linhas trazem hidden_turn. Mudar o tipo de retorno pede DROP + CREATE.
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
  hidden_turn boolean
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
    )
  FROM public.encounters AS e
  LEFT JOIN public.encounter_participants AS ep
    ON ep.party_id = e.party_id AND ep.visibility <> 'hidden'
  LEFT JOIN public.characters AS c ON c.id = ep.character_id
  WHERE e.party_id = p_party_id
    AND (private.is_party_gm(p_party_id) OR private.is_party_member(p_party_id))
  ORDER BY ep.position, ep.created_at;
$$;

REVOKE ALL ON FUNCTION public.encounter_turns(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.encounter_turns(uuid) TO authenticated, service_role;
