-- Funções das mesas: o que precisa enxergar além do RLS de quem chama.
--
-- - achar a mesa pelo código do link (quem tem o link ainda não é da mesa);
-- - achar alguém pelo username (o perfil dos outros não é legível);
-- - ver os colegas (só username e avatar, nunca o perfil inteiro) e o "básico" dos personagens
--   da mesa (nome, avatar, raça, classe, nível), sem PV, atributos, magias nem lore.
--
-- Todas são SECURITY DEFINER com search_path vazio e checam auth.uid() por conta própria. Um
-- username gerado (username_chosen = false) volta como null e não é achado na busca.
-- Os erros usam a mensagem como código (party_*), traduzido pelo app.

-- Preview do link de convite: a mesa, quem é o mestre e o vínculo de quem abriu
CREATE FUNCTION public.get_party_invite(p_code text)
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
  JOIN public.profile AS gm ON gm.id = p.gm_id
  WHERE i.code = p_code;
$$;

-- Pedir para entrar pelo link. Quem já foi convidado entra direto (os dois lados querem).
CREATE FUNCTION public.request_party_join(p_code text)
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

-- O mestre convida pelo username. Quem já tinha pedido entra direto.
CREATE FUNCTION public.invite_to_party(p_party_id uuid, p_username text)
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
  RETURN v_status;
END;
$$;

-- Quem está na mesa: o mestre (status 'gm') e os membros. O mestre vê todos, com pedidos e
-- convites; um membro ativo vê o mestre e os ativos; outros, nada.
CREATE FUNCTION public.party_people(p_party_id uuid)
RETURNS TABLE (user_id uuid, username text, avatar_url text, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH viewer AS (
    SELECT private.is_party_gm(p_party_id) AS is_gm, private.is_party_member(p_party_id) AS is_member
  )
  SELECT pr.id, CASE WHEN pr.username_chosen THEN pr.username END, pr.avatar_url, 'gm'
  FROM public.parties AS p
  JOIN public.profile AS pr ON pr.id = p.gm_id
  CROSS JOIN viewer
  WHERE p.id = p_party_id AND (viewer.is_gm OR viewer.is_member)
  UNION ALL
  SELECT pr.id, CASE WHEN pr.username_chosen THEN pr.username END, pr.avatar_url, m.status
  FROM public.party_members AS m
  JOIN public.profile AS pr ON pr.id = m.user_id
  CROSS JOIN viewer
  WHERE m.party_id = p_party_id
    AND (viewer.is_gm OR (viewer.is_member AND m.status = 'active'));
$$;

-- O "básico" dos personagens da mesa, para o mestre e os membros ativos
CREATE FUNCTION public.party_roster(p_party_id uuid)
RETURNS TABLE (
  character_id uuid,
  owner_id uuid,
  name text,
  avatar_url text,
  race text,
  class text,
  level smallint,
  theme_color text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    c.id,
    c.owner_id,
    c.name,
    c.avatar_url,
    c.system_data->>'race',
    c.system_data->>'class',
    c.level,
    c.theme_color
  FROM public.party_characters AS pc
  JOIN public.characters AS c ON c.id = pc.character_id
  JOIN public.party_members AS m
    ON m.party_id = pc.party_id AND m.user_id = c.owner_id AND m.status = 'active'
  WHERE pc.party_id = p_party_id
    AND c.kind = 'pc'
    AND c.deleted_at IS NULL
    AND (private.is_party_gm(p_party_id) OR private.is_party_member(p_party_id))
  ORDER BY c.name, c.id;
$$;

-- As mesas de quem chama: como mestre (com os pedidos pendentes) e como jogador (qualquer status)
CREATE FUNCTION public.my_parties()
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
    JOIN public.profile AS gm ON gm.id = p.gm_id
    WHERE m.user_id = (SELECT auth.uid())
  ) AS mine (party_id, name, system, role, status, gm_username, pending_requests)
  ORDER BY name, party_id;
$$;

REVOKE ALL ON FUNCTION
  public.get_party_invite(text),
  public.request_party_join(text),
  public.invite_to_party(uuid, text),
  public.party_people(uuid),
  public.party_roster(uuid),
  public.my_parties()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.get_party_invite(text),
  public.request_party_join(text),
  public.invite_to_party(uuid, text),
  public.party_people(uuid),
  public.party_roster(uuid),
  public.my_parties()
TO authenticated, service_role;
