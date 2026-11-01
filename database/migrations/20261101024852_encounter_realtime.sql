-- Combate em tempo real: Broadcast privado do Supabase no tópico party:<id da mesa>.
--
-- Cada mudança no combate (e cada ficha salva que está num combate) manda um aviso SEM conteúdo
-- ('{}'), e o app busca de novo a própria visão pela API. Assim nada que o jogador não pode ver
-- trafega no canal. Quem escuta: o mestre e os membros ativos (política de SELECT em
-- realtime.messages). Ninguém envia pelo cliente: não há política de INSERT.

-- 1. Quem escuta o tópico
CREATE FUNCTION private.can_listen_party(p_topic text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_party_id uuid;
BEGIN
  -- Só converte o que tem a forma de um tópico de mesa: um tópico qualquer não dá erro de cast
  IF p_topic IS NULL OR p_topic !~ '^party:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN false;
  END IF;
  v_party_id := substr(p_topic, 7)::uuid;
  RETURN private.is_party_gm(v_party_id) OR private.is_party_member(v_party_id);
END;
$$;

REVOKE ALL ON FUNCTION private.can_listen_party(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.can_listen_party(text) TO authenticated, service_role;

CREATE POLICY "party_channel_listen"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (
    realtime.messages.extension = 'broadcast'
    AND private.can_listen_party((SELECT realtime.topic()))
  );

-- 2. Avisos
CREATE FUNCTION private.notify_encounter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM realtime.send(
    '{}'::jsonb,
    'encounter',
    'party:' || (CASE WHEN TG_OP = 'DELETE' THEN OLD.party_id ELSE NEW.party_id END)::text,
    true
  );
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_encounters_notify
  AFTER INSERT OR UPDATE OR DELETE ON public.encounters
  FOR EACH ROW EXECUTE FUNCTION private.notify_encounter();

CREATE TRIGGER trg_encounter_participants_notify
  AFTER INSERT OR UPDATE OR DELETE ON public.encounter_participants
  FOR EACH ROW EXECUTE FUNCTION private.notify_encounter();

-- A ficha salva (PV do jogador, CA, espaços de magia) muda o que o mestre vê no combate
CREATE FUNCTION private.notify_character_encounters()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM realtime.send('{}'::jsonb, 'encounter', 'party:' || p.party_id::text, true)
  FROM (
    SELECT DISTINCT party_id FROM public.encounter_participants WHERE character_id = NEW.id
  ) AS p;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_characters_notify_encounters
  AFTER UPDATE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION private.notify_character_encounters();

REVOKE ALL ON FUNCTION private.notify_encounter(), private.notify_character_encounters()
  FROM PUBLIC, anon, authenticated;
