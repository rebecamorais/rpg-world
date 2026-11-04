-- A mesa continua quando a conta do mestre é excluída, enquanto houver jogador ativo.
--
-- - parties.gm_id aceita NULL e o FK passa a ON DELETE SET NULL. Sem jogador ativo a mesa é apagada;
--   com jogador ativo, perde a imagem (o arquivo está na pasta de quem saiu) e o combate (os NPCs
--   eram de quem saiu). Baú, diário, pedidos e convites ficam.
-- - Ninguém entra numa mesa sem mestre: não há quem aprove. Pedidos e convites esperam guardados.
-- - Sem jogador ativo a mesa não tem quem a acesse: o último a sair ou excluir a conta a apaga.
--
-- Revisão de todo uso de gm_id, com gm_id nulo (as comparações `gm_id = x` dão NULL, que não passa):
--
-- 20261031155304_parties.sql
-- - private.is_party_gm: nula, é false para todos. É o que segura as políticas e funções que passam
--   por ela: party_invites, party_members, party_characters, encounters, encounter_participants,
--   party_journals, containers, encounter_turns e afins. Só o que aceita também is_party_member
--   continua aberto, e é o que o jogador ativo já podia fazer.
-- - check_party_gm_limit: só roda em INSERT. Com gm_id nulo não trava nem conta nada, mas a política
--   parties_insert_gm recusa o INSERT logo depois.
-- - parties_select_gm_or_member: sobra a parte de quem tem vínculo com a mesa, como já era.
-- - parties_insert_gm, parties_update_gm, parties_delete_gm: ninguém passa. E a coluna gm_id nem tem
--   GRANT de UPDATE para authenticated.
-- 20261031155614_party_functions.sql
-- - get_party_invite: o CASE cai no status de quem chama; o JOIN esconderia a mesa e vira LEFT JOIN
--   aqui.
-- - request_party_join: passa a recusar aqui.
-- - invite_to_party (versão de 20261101024058): v_gm_id nulo já dá party_not_found; não muda.
-- - party_people: a parte do mestre continua JOIN, o que tira a linha 'gm'; não muda.
-- - my_parties: a parte do mestre filtra gm_id = auth.uid() e continua JOIN; a do jogador esconderia
--   a mesa e vira LEFT JOIN aqui.
-- 20261031155739_party_gm_reads_characters.sql e 20261101024058_party_fixes.sql
-- - gm_reads_character (já removida) e gm_readable_character_ids: p.gm_id = auth.uid() não
--   casa, então ninguém ganha a leitura da ficha de mestre; não muda.
-- 20261103190000_party_chest_and_image.sql
-- - parties_image_url_check: com gm_id nulo a regex dá NULL e a CHECK passa para qualquer URL. Por
--   isso o gatilho abaixo limpa a imagem, e só o mestre (RLS) poderia gravar outra.
-- - party_invite_card e orphan_avatar_objects não leem gm_id; a imagem limpa vira órfã e é recolhida.

-- 1. A coluna
ALTER TABLE public.parties
  ALTER COLUMN gm_id DROP NOT NULL,
  DROP CONSTRAINT parties_gm_id_fkey,
  ADD CONSTRAINT parties_gm_id_fkey
    FOREIGN KEY (gm_id) REFERENCES public.profile (id) ON DELETE SET NULL;

-- 2. Quando o mestre sai. O SET NULL do FK é um UPDATE da coluna, então estes gatilhos rodam nele.
CREATE FUNCTION private.clear_party_image_without_gm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.image_url := NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_parties_clear_image_without_gm
  BEFORE UPDATE OF gm_id ON public.parties
  FOR EACH ROW
  WHEN (NEW.gm_id IS NULL)
  EXECUTE FUNCTION private.clear_party_image_without_gm();

CREATE FUNCTION private.after_party_gm_removed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.party_members
    WHERE party_id = NEW.id AND status = 'active'
  ) THEN
    DELETE FROM public.encounters WHERE party_id = NEW.id;
  ELSE
    DELETE FROM public.parties WHERE id = NEW.id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_parties_after_gm_removed
  AFTER UPDATE OF gm_id ON public.parties
  FOR EACH ROW
  WHEN (OLD.gm_id IS NOT NULL AND NEW.gm_id IS NULL)
  EXECUTE FUNCTION private.after_party_gm_removed();

-- 3. Quando um membro sai. A mesa pode já ter sido apagada (a cascata dela passa por aqui). O lock
--    na mesa faz os dois últimos jogadores saindo ao mesmo tempo, ou um saindo enquanto o mestre
--    exclui a conta, se enxergarem: sem ele, cada um veria o outro ainda ativo e a mesa ficaria
--    sem ninguém.
CREATE FUNCTION private.after_party_member_removed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_gm_id uuid;
BEGIN
  SELECT gm_id INTO v_gm_id FROM public.parties WHERE id = OLD.party_id FOR NO KEY UPDATE;
  IF FOUND AND v_gm_id IS NULL AND NOT EXISTS (
    SELECT 1 FROM public.party_members
    WHERE party_id = OLD.party_id AND status = 'active'
  ) THEN
    DELETE FROM public.parties WHERE id = OLD.party_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_party_members_after_removed
  AFTER DELETE ON public.party_members
  FOR EACH ROW EXECUTE FUNCTION private.after_party_member_removed();

-- 4. Ninguém entra sem mestre: nem aceitando um convite antigo
CREATE FUNCTION private.block_join_without_gm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.parties WHERE id = NEW.party_id AND gm_id IS NULL) THEN
    RAISE EXCEPTION USING MESSAGE = 'party_without_gm', ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_party_members_block_join_without_gm
  BEFORE UPDATE OF status ON public.party_members
  FOR EACH ROW
  WHEN (NEW.status = 'active' AND OLD.status <> 'active')
  EXECUTE FUNCTION private.block_join_without_gm();

REVOKE ALL ON FUNCTION
  private.clear_party_image_without_gm(),
  private.after_party_gm_removed(),
  private.after_party_member_removed(),
  private.block_join_without_gm()
FROM PUBLIC, anon, authenticated;

-- 5. As funções que escondiam a mesa ou deixavam entrar
CREATE OR REPLACE FUNCTION public.get_party_invite(p_code text)
RETURNS TABLE (party_id uuid, name text, gm_username text, my_status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    p.id,
    p.name,
    CASE WHEN gm.username_chosen THEN gm.username END,
    CASE
      WHEN p.gm_id = (SELECT auth.uid()) THEN 'gm'
      ELSE (
        SELECT m.status FROM public.party_members AS m
        WHERE m.party_id = p.id AND m.user_id = (SELECT auth.uid())
      )
    END
  FROM public.party_invites AS i
  JOIN public.parties AS p ON p.id = i.party_id
  LEFT JOIN public.profile AS gm ON gm.id = p.gm_id
  WHERE i.code = p_code;
$$;

CREATE OR REPLACE FUNCTION public.request_party_join(p_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_party_id uuid;
  v_gm_id uuid;
  v_status text;
BEGIN
  SELECT p.id, p.gm_id INTO v_party_id, v_gm_id
  FROM public.party_invites AS i
  JOIN public.parties AS p ON p.id = i.party_id
  WHERE i.code = p_code;

  IF v_party_id IS NULL OR v_uid IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'party_invite_not_found', ERRCODE = 'P0001';
  END IF;
  IF v_gm_id IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'party_without_gm', ERRCODE = 'P0001';
  END IF;
  IF v_gm_id = v_uid THEN
    RAISE EXCEPTION USING MESSAGE = 'party_gm_cannot_join', ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.party_members (party_id, user_id, status)
  VALUES (v_party_id, v_uid, 'requested')
  ON CONFLICT (party_id, user_id) DO NOTHING
  RETURNING status INTO v_status;
  IF v_status IS NOT NULL THEN
    RETURN v_status;
  END IF;

  UPDATE public.party_members SET status = 'active'
  WHERE party_id = v_party_id AND user_id = v_uid AND status = 'invited'
  RETURNING status INTO v_status;
  IF v_status IS NOT NULL THEN
    RETURN v_status;
  END IF;

  SELECT status INTO v_status FROM public.party_members
  WHERE party_id = v_party_id AND user_id = v_uid;
  RETURN v_status;
END;
$$;

CREATE OR REPLACE FUNCTION public.my_parties()
RETURNS TABLE (
  party_id uuid,
  name text,
  system text,
  role text,
  status text,
  gm_username text,
  pending_requests int
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
      )
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
      0
    FROM public.party_members AS m
    JOIN public.parties AS p ON p.id = m.party_id
    LEFT JOIN public.profile AS gm ON gm.id = p.gm_id
    WHERE m.user_id = (SELECT auth.uid())
  ) AS mine (party_id, name, system, role, status, gm_username, pending_requests)
  ORDER BY name, party_id;
$$;
