-- Mesa e baú em tempo real, e o pedido recusado.
--
-- 1. A mesa: no mesmo tópico privado do combate (party:<id da mesa>, de
--    20261101024852_encounter_realtime.sql), o banco manda um aviso 'party' SEM conteúdo quando
--    muda o que a aba Mesa mostra: quem está na mesa (pedidos, convites, aprovações, saídas), os
--    personagens levados, o básico desses personagens, o diário, o pedido para virar mestre e a
--    própria mesa. O app busca de novo a própria visão pela API, então nada que a pessoa não pode
--    ver trafega no canal. Quem escuta continua sendo a política party_channel_listen (o mestre e os
--    membros ativos); ninguém envia pelo cliente, porque não há política de INSERT.
-- 2. O baú: um aviso 'chest' no mesmo tópico quando as moedas ou os itens do baú mudam.
-- 3. O pedido recusado: quando o mestre recusa um pedido para entrar, a pessoa vê isso na página do
--    convite (get_party_invite responde 'declined'), em vez de ver de novo "Pedir para entrar" sem
--    aviso. Não guarda quem recusou. Pedir de novo, ou ser convidada, apaga a marca.
--
-- Só acrescenta: tabelas, funções e gatilhos novos, e get_party_invite com o mesmo tipo de retorno.

-- 1. Avisos da mesa

-- Tabelas com party_id
CREATE FUNCTION private.notify_party()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_party_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_party_id := OLD.party_id;
  ELSE
    v_party_id := NEW.party_id;
  END IF;
  PERFORM realtime.send('{}'::jsonb, 'party', 'party:' || v_party_id::text, true);
  RETURN NULL;
END;
$$;

-- A própria mesa (nome, edição, imagem, mestre; e a exclusão, para quem está com ela aberta)
CREATE FUNCTION private.notify_party_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM realtime.send(
    '{}'::jsonb,
    'party',
    'party:' || (CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END)::text,
    true
  );
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_party_members_notify
  AFTER INSERT OR UPDATE OR DELETE ON public.party_members
  FOR EACH ROW EXECUTE FUNCTION private.notify_party();

CREATE TRIGGER trg_party_characters_notify
  AFTER INSERT OR UPDATE OR DELETE ON public.party_characters
  FOR EACH ROW EXECUTE FUNCTION private.notify_party();

CREATE TRIGGER trg_party_journals_notify
  AFTER INSERT OR UPDATE OR DELETE ON public.party_journals
  FOR EACH ROW EXECUTE FUNCTION private.notify_party();

CREATE TRIGGER trg_party_gm_claims_notify
  AFTER INSERT OR UPDATE OR DELETE ON public.party_gm_claims
  FOR EACH ROW EXECUTE FUNCTION private.notify_party();

CREATE TRIGGER trg_party_gm_claim_votes_notify
  AFTER INSERT OR UPDATE OR DELETE ON public.party_gm_claim_votes
  FOR EACH ROW EXECUTE FUNCTION private.notify_party();

CREATE TRIGGER trg_parties_notify
  AFTER UPDATE OR DELETE ON public.parties
  FOR EACH ROW EXECUTE FUNCTION private.notify_party_row();

-- Os personagens levados: avisa cada mesa em que o personagem está
CREATE FUNCTION private.notify_parties_of_character(p_character_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- PERFORM, e não o SELECT final de uma função SQL: esse pode parar na primeira linha (uma mesa só)
  PERFORM realtime.send('{}'::jsonb, 'party', 'party:' || pc.party_id::text, true)
  FROM public.party_characters AS pc
  WHERE pc.character_id = p_character_id;
END;
$$;

CREATE FUNCTION private.notify_character_parties()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM private.notify_parties_of_character(NEW.id);
  RETURN NULL;
END;
$$;

CREATE FUNCTION private.notify_character_lore_parties()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM private.notify_parties_of_character(NEW.character_id);
  RETURN NULL;
END;
$$;

-- Só o que a mesa mostra (party_roster e o Role Play do mestre). PV, espaços e o resto do que muda
-- a cada jogada ficam de fora: a mesa não mostra, e o combate já tem o próprio aviso.
CREATE TRIGGER trg_characters_notify_parties
  AFTER UPDATE ON public.characters
  FOR EACH ROW
  WHEN (
    OLD.name IS DISTINCT FROM NEW.name
    OR OLD.avatar_url IS DISTINCT FROM NEW.avatar_url
    OR OLD.level IS DISTINCT FROM NEW.level
    OR OLD.theme_color IS DISTINCT FROM NEW.theme_color
    OR OLD.attributes IS DISTINCT FROM NEW.attributes
    OR OLD.deleted_at IS DISTINCT FROM NEW.deleted_at
    OR OLD.kind IS DISTINCT FROM NEW.kind
    OR OLD.system_data->'race' IS DISTINCT FROM NEW.system_data->'race'
    OR OLD.system_data->'class' IS DISTINCT FROM NEW.system_data->'class'
    OR OLD.system_data->'skills' IS DISTINCT FROM NEW.system_data->'skills'
  )
  EXECUTE FUNCTION private.notify_character_parties();

-- Personalidade, ideais, vínculos e defeitos (o Role Play do mestre). História, aparência e o
-- resto da aba Lore ficam de fora: são salvos enquanto a pessoa escreve, e a mesa não os mostra.
CREATE TRIGGER trg_character_lore_notify_parties_insert
  AFTER INSERT ON public.character_lore
  FOR EACH ROW EXECUTE FUNCTION private.notify_character_lore_parties();

CREATE TRIGGER trg_character_lore_notify_parties_update
  AFTER UPDATE ON public.character_lore
  FOR EACH ROW
  WHEN (
    OLD.personality_traits IS DISTINCT FROM NEW.personality_traits
    OR OLD.ideals IS DISTINCT FROM NEW.ideals
    OR OLD.bonds IS DISTINCT FROM NEW.bonds
    OR OLD.flaws IS DISTINCT FROM NEW.flaws
  )
  EXECUTE FUNCTION private.notify_character_lore_parties();

-- 2. Avisos do baú

-- As moedas ficam no próprio container do baú
CREATE FUNCTION private.notify_party_chest()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM realtime.send('{}'::jsonb, 'chest', 'party:' || NEW.party_id::text, true);
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_containers_notify_party_chest
  AFTER UPDATE ON public.containers
  FOR EACH ROW
  WHEN (NEW.party_id IS NOT NULL)
  EXECUTE FUNCTION private.notify_party_chest();

-- Os itens: só os de um container de mesa. Quando a mesa é apagada, o container já saiu e nada é
-- enviado. Mover um item é trocar o container_id: avisa a mesa de onde ele saiu e a de onde chegou
-- (uma vez só, se for a mesma).
CREATE FUNCTION private.notify_party_chest_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_old uuid;
  v_new uuid;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    v_old := OLD.container_id;
  END IF;
  IF TG_OP <> 'DELETE' THEN
    v_new := NEW.container_id;
  END IF;
  PERFORM realtime.send('{}'::jsonb, 'chest', 'party:' || parties.party_id::text, true)
  FROM (
    SELECT DISTINCT c.party_id
    FROM public.containers AS c
    WHERE c.id IN (v_old, v_new) AND c.party_id IS NOT NULL
  ) AS parties;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_inventory_items_notify_party_chest
  AFTER INSERT OR UPDATE OR DELETE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION private.notify_party_chest_item();

-- 3. Pedido recusado
--
-- No schema private: a Data API não expõe a tabela, e só as funções abaixo (SECURITY DEFINER)
-- leem e gravam. Sem políticas: authenticated não tem acesso direto.
CREATE TABLE private.party_declined_requests (
  party_id    uuid         NOT NULL REFERENCES public.parties (id) ON DELETE CASCADE,
  user_id     uuid         NOT NULL REFERENCES public.profile (id) ON DELETE CASCADE,
  declined_at timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (party_id, user_id)
);
CREATE INDEX idx_party_declined_requests_user_id ON private.party_declined_requests (user_id);

ALTER TABLE private.party_declined_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE private.party_declined_requests FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE private.party_declined_requests TO service_role;

-- Só conta quando é o mestre da mesa quem apaga um pedido. A própria pessoa desistindo não conta,
-- nem a mesa sendo apagada (o INSERT parte da mesa: se ela já saiu, nada é gravado), nem a conta
-- sendo excluída (sem auth.uid() do mestre), nem o pedido que cai junto com o link antigo quando o
-- mestre troca o link (o DELETE vem de dentro do gatilho trg_party_invites_drop_requests).
CREATE FUNCTION private.remember_declined_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- 1 é este gatilho rodando sobre um DELETE direto; mais que isso, o DELETE veio de outro gatilho.
  -- No WHEN não daria: ele é avaliado antes de o gatilho entrar (o DELETE direto ali ainda é 0).
  IF pg_trigger_depth() > 1 THEN
    RETURN NULL;
  END IF;
  INSERT INTO private.party_declined_requests (party_id, user_id)
  SELECT p.id, OLD.user_id
  FROM public.parties AS p
  JOIN public.profile AS u ON u.id = OLD.user_id
  WHERE p.id = OLD.party_id
    AND p.gm_id = (SELECT auth.uid())
    AND p.gm_id IS DISTINCT FROM OLD.user_id
  ON CONFLICT (party_id, user_id) DO UPDATE SET declined_at = now();
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_party_members_remember_declined
  AFTER DELETE ON public.party_members
  FOR EACH ROW
  WHEN (OLD.status = 'requested')
  EXECUTE FUNCTION private.remember_declined_request();

-- Um vínculo novo (pedir de novo, ser convidada) apaga a recusa
CREATE FUNCTION private.forget_declined_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM private.party_declined_requests
  WHERE party_id = NEW.party_id AND user_id = NEW.user_id;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_party_members_forget_declined
  AFTER INSERT ON public.party_members
  FOR EACH ROW EXECUTE FUNCTION private.forget_declined_request();

-- get_party_invite: 'declined' quando a pessoa não tem vínculo e o último pedido foi recusado.
-- Mesmo tipo de retorno, então CREATE OR REPLACE mantém os grants de 20261104180000.
CREATE OR REPLACE FUNCTION public.get_party_invite(p_code text)
RETURNS TABLE (party_id uuid, name text, gm_username text, my_status text, has_gm boolean)
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
      ELSE COALESCE(
        (
          SELECT m.status FROM public.party_members AS m
          WHERE m.party_id = p.id AND m.user_id = (SELECT auth.uid())
        ),
        (
          SELECT 'declined' FROM private.party_declined_requests AS d
          WHERE d.party_id = p.id AND d.user_id = (SELECT auth.uid())
        )
      )
    END,
    p.gm_id IS NOT NULL
  FROM public.party_invites AS i
  JOIN public.parties AS p ON p.id = i.party_id
  LEFT JOIN public.profile AS gm ON gm.id = p.gm_id
  WHERE i.code = p_code;
$$;

REVOKE ALL ON FUNCTION
  private.notify_party(),
  private.notify_party_row(),
  private.notify_parties_of_character(uuid),
  private.notify_character_parties(),
  private.notify_character_lore_parties(),
  private.notify_party_chest(),
  private.notify_party_chest_item(),
  private.remember_declined_request(),
  private.forget_declined_request()
FROM PUBLIC, anon, authenticated;
