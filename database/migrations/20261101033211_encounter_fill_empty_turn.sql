-- Combate que esvaziou no meio (todos saíram ou foram tirados): fica com rodada > 0 e sem vez
-- atual, e nem start_encounter (só na rodada 0) nem end_turn (precisa do atual) andam. Quem entra
-- num combate assim fica com a vez, e a rodada continua.
CREATE FUNCTION private.fill_empty_turn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.encounters
  SET current_participant_id = NEW.id
  WHERE party_id = NEW.party_id AND round > 0 AND current_participant_id IS NULL;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_encounter_participants_fill_empty_turn
  AFTER INSERT ON public.encounter_participants
  FOR EACH ROW EXECUTE FUNCTION private.fill_empty_turn();

REVOKE ALL ON FUNCTION private.fill_empty_turn() FROM PUBLIC, anon, authenticated;
