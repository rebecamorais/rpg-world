-- Correções da fase 1 das mesas.
--
-- 1. Leitura do mestre por conjunto: as políticas chamavam private.gm_reads_character(id) para
--    cada linha, e um SELECT sem filtro em characters pagava a função linha a linha. Agora a lista
--    dos ids que o mestre lê é calculada uma vez por consulta.
-- 2. Personagem apagado (deleted_at) sai das mesas na hora; restaurar não o traz de volta.
-- 3. Trocar o código do link descarta os pedidos pendentes (feitos, talvez, pelo link antigo).
-- 4. Convidar quem já é membro ativo é um erro (party_already_member), não um "entrou na mesa".

-- 1. Leitura do mestre
CREATE FUNCTION private.gm_readable_character_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT pc.character_id
  FROM public.party_characters AS pc
  JOIN public.parties AS p ON p.id = pc.party_id
  JOIN public.characters AS c ON c.id = pc.character_id
  JOIN public.party_members AS m
    ON m.party_id = pc.party_id AND m.user_id = c.owner_id AND m.status = 'active'
  WHERE p.gm_id = (SELECT auth.uid())
    AND c.kind = 'pc'
    AND c.deleted_at IS NULL;
$$;

REVOKE ALL ON FUNCTION private.gm_readable_character_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.gm_readable_character_ids() TO authenticated, service_role;

DROP POLICY "characters_select_party_gm" ON public.characters;
DROP POLICY "character_lore_select_party_gm" ON public.character_lore;
DROP POLICY "character_spells_select_party_gm" ON public.character_spells;
DROP FUNCTION private.gm_reads_character(uuid);

CREATE POLICY "characters_select_party_gm"
  ON public.characters FOR SELECT
  USING (id IN (SELECT private.gm_readable_character_ids()));

CREATE POLICY "character_lore_select_party_gm"
  ON public.character_lore FOR SELECT
  USING (character_id IN (SELECT private.gm_readable_character_ids()));

CREATE POLICY "character_spells_select_party_gm"
  ON public.character_spells FOR SELECT
  USING (character_id IN (SELECT private.gm_readable_character_ids()));

-- 2. Personagem apagado sai das mesas
CREATE FUNCTION private.drop_deleted_character()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.party_characters WHERE character_id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_characters_drop_deleted
  AFTER UPDATE OF deleted_at ON public.characters
  FOR EACH ROW
  WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
  EXECUTE FUNCTION private.drop_deleted_character();

-- 3. Trocar o link descarta os pedidos pendentes
CREATE FUNCTION private.drop_party_requests()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.party_members WHERE party_id = NEW.party_id AND status = 'requested';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_party_invites_drop_requests
  AFTER UPDATE OF code ON public.party_invites
  FOR EACH ROW
  WHEN (OLD.code IS DISTINCT FROM NEW.code)
  EXECUTE FUNCTION private.drop_party_requests();

REVOKE ALL ON FUNCTION private.drop_deleted_character(), private.drop_party_requests()
  FROM PUBLIC, anon, authenticated;

-- 4. Convidar quem já é membro
CREATE OR REPLACE FUNCTION public.invite_to_party(p_party_id uuid, p_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_gm_id uuid;
  v_user_id uuid;
  v_status text;
BEGIN
  SELECT gm_id INTO v_gm_id FROM public.parties WHERE id = p_party_id;
  IF v_gm_id IS NULL OR v_uid IS NULL OR v_gm_id <> v_uid THEN
    RAISE EXCEPTION USING MESSAGE = 'party_not_found', ERRCODE = 'P0001';
  END IF;

  SELECT id INTO v_user_id FROM public.profile
  WHERE lower(username) = lower(btrim(p_username)) AND username_chosen;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'party_user_not_found', ERRCODE = 'P0001';
  END IF;
  IF v_user_id = v_gm_id THEN
    RAISE EXCEPTION USING MESSAGE = 'party_gm_cannot_join', ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.party_members (party_id, user_id, status)
  VALUES (p_party_id, v_user_id, 'invited')
  ON CONFLICT (party_id, user_id) DO NOTHING
  RETURNING status INTO v_status;
  IF v_status IS NOT NULL THEN
    RETURN v_status;
  END IF;

  UPDATE public.party_members SET status = 'active'
  WHERE party_id = p_party_id AND user_id = v_user_id AND status = 'requested'
  RETURNING status INTO v_status;
  IF v_status IS NOT NULL THEN
    RETURN v_status;
  END IF;

  SELECT status INTO v_status FROM public.party_members
  WHERE party_id = p_party_id AND user_id = v_user_id;
  IF v_status = 'active' THEN
    RAISE EXCEPTION USING MESSAGE = 'party_already_member', ERRCODE = 'P0001';
  END IF;
  RETURN v_status;
END;
$$;
