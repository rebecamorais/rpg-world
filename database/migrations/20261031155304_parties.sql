-- Mesas (fase 1): a mesa, quem está nela e quais personagens cada um levou.
--
-- - parties: a mesa; o mestre é o gm_id (não é linha em party_members). No máximo 5 por mestre.
-- - party_invites: o código do link de convite, numa tabela só do mestre (os jogadores leem a
--   mesa, mas não o link). Trocar o código invalida o antigo.
-- - party_members: requested (pediu pelo link, espera o mestre), invited (o mestre convidou,
--   espera a pessoa) ou active. Ninguém insere direto: as funções de convite da próxima migração
--   fazem isso. Aprovar e aceitar passam pelo RLS, cada um do seu lado.
-- - party_characters: os personagens que cada membro ativo levou. Sair da mesa apaga essas
--   linhas, nunca o personagem.

-- Funções novas do schema private nascem sem EXECUTE para PUBLIC (o padrão do Postgres daria)
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA private
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- 1. Tabelas
CREATE TABLE public.parties (
  id          uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text               NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 60),
  system      public.rpg_system  NOT NULL DEFAULT 'dnd_5e',
  gm_id       uuid               NOT NULL REFERENCES public.profile (id) ON DELETE CASCADE,
  created_at  timestamptz        NOT NULL DEFAULT now(),
  updated_at  timestamptz        NOT NULL DEFAULT now()
);
CREATE INDEX idx_parties_gm_id ON public.parties (gm_id);

CREATE TRIGGER trg_parties_updated_at
  BEFORE UPDATE ON public.parties
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.party_invites (
  party_id  uuid  PRIMARY KEY REFERENCES public.parties (id) ON DELETE CASCADE,
  code      text  NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', '')
                  CHECK (code ~ '^[a-f0-9]{32}$')
);

CREATE TABLE public.party_members (
  party_id    uuid         NOT NULL REFERENCES public.parties (id) ON DELETE CASCADE,
  user_id     uuid         NOT NULL REFERENCES public.profile (id) ON DELETE CASCADE,
  status      text         NOT NULL CHECK (status IN ('requested', 'invited', 'active')),
  created_at  timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (party_id, user_id)
);
CREATE INDEX idx_party_members_user_id ON public.party_members (user_id);

CREATE TABLE public.party_characters (
  party_id      uuid  NOT NULL REFERENCES public.parties (id) ON DELETE CASCADE,
  character_id  uuid  NOT NULL REFERENCES public.characters (id) ON DELETE CASCADE,
  PRIMARY KEY (party_id, character_id)
);
CREATE INDEX idx_party_characters_character_id ON public.party_characters (character_id);

-- 2. Quem é quem, para as políticas. SECURITY DEFINER: uma política de party_members que
--    consultasse party_members cairia em recursão de RLS. Ficam no schema private, que a API não
--    expõe; authenticated só precisa de EXECUTE para as políticas rodarem.
CREATE FUNCTION private.is_party_gm(p_party_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.parties
    WHERE id = p_party_id AND gm_id = (SELECT auth.uid())
  );
$$;

CREATE FUNCTION private.is_party_member(p_party_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.party_members
    WHERE party_id = p_party_id AND user_id = (SELECT auth.uid()) AND status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION private.is_party_gm(uuid), private.is_party_member(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_party_gm(uuid), private.is_party_member(uuid)
  TO authenticated, service_role;

-- 3. Gatilhos
-- No máximo 5 mesas por mestre. O lock por mestre impede que duas criações ao mesmo tempo passem
-- as duas pela contagem.
CREATE FUNCTION private.check_party_gm_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('party_gm_limit:' || NEW.gm_id::text));
  IF (SELECT count(*) FROM public.parties WHERE gm_id = NEW.gm_id) >= 5 THEN
    RAISE EXCEPTION USING MESSAGE = 'party_gm_limit', ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_parties_gm_limit
  BEFORE INSERT ON public.parties
  FOR EACH ROW EXECUTE FUNCTION private.check_party_gm_limit();

-- Toda mesa nasce com um código de convite
CREATE FUNCTION private.create_party_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.party_invites (party_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_parties_create_invite
  AFTER INSERT ON public.parties
  FOR EACH ROW EXECUTE FUNCTION private.create_party_invite();

-- Quem sai (ou é tirado) deixa de ter personagens naquela mesa; os personagens ficam
CREATE FUNCTION private.drop_party_characters_of_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.party_characters AS pc
  USING public.characters AS c
  WHERE pc.party_id = OLD.party_id
    AND c.id = pc.character_id
    AND c.owner_id = OLD.user_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_party_members_drop_characters
  AFTER DELETE ON public.party_members
  FOR EACH ROW EXECUTE FUNCTION private.drop_party_characters_of_member();

REVOKE ALL ON FUNCTION
  private.check_party_gm_limit(),
  private.create_party_invite(),
  private.drop_party_characters_of_member()
FROM PUBLIC, anon, authenticated;

-- 4. RLS
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_characters ENABLE ROW LEVEL SECURITY;

-- parties: o mestre, e quem tem qualquer vínculo (inclusive convite ou pedido, para ver o nome)
CREATE POLICY "parties_select_gm_or_member"
  ON public.parties FOR SELECT
  USING (
    gm_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.party_members AS m
      WHERE m.party_id = parties.id AND m.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "parties_insert_gm"
  ON public.parties FOR INSERT
  WITH CHECK (gm_id = (SELECT auth.uid()));

CREATE POLICY "parties_update_gm"
  ON public.parties FOR UPDATE
  USING (gm_id = (SELECT auth.uid()))
  WITH CHECK (gm_id = (SELECT auth.uid()));

CREATE POLICY "parties_delete_gm"
  ON public.parties FOR DELETE
  USING (gm_id = (SELECT auth.uid()));

-- party_invites: só o mestre lê e troca
CREATE POLICY "party_invites_select_gm"
  ON public.party_invites FOR SELECT
  USING (private.is_party_gm(party_id));

CREATE POLICY "party_invites_update_gm"
  ON public.party_invites FOR UPDATE
  USING (private.is_party_gm(party_id))
  WITH CHECK (private.is_party_gm(party_id));

-- party_members: a própria linha, tudo para o mestre, e os ativos para quem é ativo
CREATE POLICY "party_members_select"
  ON public.party_members FOR SELECT
  USING (
    user_id = (SELECT auth.uid())
    OR private.is_party_gm(party_id)
    OR (status = 'active' AND private.is_party_member(party_id))
  );

-- O mestre aprova pedidos; não aprova um convite que ele mesmo mandou
CREATE POLICY "party_members_update_gm_approves"
  ON public.party_members FOR UPDATE
  USING (private.is_party_gm(party_id) AND status = 'requested')
  WITH CHECK (private.is_party_gm(party_id) AND status = 'active');

-- O convidado aceita o convite; não aprova o próprio pedido
CREATE POLICY "party_members_update_invitee_accepts"
  ON public.party_members FOR UPDATE
  USING (user_id = (SELECT auth.uid()) AND status = 'invited')
  WITH CHECK (user_id = (SELECT auth.uid()) AND status = 'active');

-- Sair, recusar ou desistir (a própria linha); tirar, recusar ou cancelar (o mestre)
CREATE POLICY "party_members_delete"
  ON public.party_members FOR DELETE
  USING (user_id = (SELECT auth.uid()) OR private.is_party_gm(party_id));

-- party_characters: quem é da mesa vê quais personagens estão nela (o conteúdo das fichas tem
-- regras próprias); cada membro ativo leva os próprios personagens jogáveis
CREATE POLICY "party_characters_select"
  ON public.party_characters FOR SELECT
  USING (private.is_party_gm(party_id) OR private.is_party_member(party_id));

CREATE POLICY "party_characters_insert_own"
  ON public.party_characters FOR INSERT
  WITH CHECK (
    private.is_party_member(party_id)
    AND EXISTS (
      SELECT 1 FROM public.characters AS c
      WHERE c.id = party_characters.character_id
        AND c.owner_id = (SELECT auth.uid())
        AND c.kind = 'pc'
        AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "party_characters_delete_own"
  ON public.party_characters FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.characters AS c
    WHERE c.id = party_characters.character_id
      AND c.owner_id = (SELECT auth.uid())
  ));

-- 5. Grants (a migração 20261020130000 revoga por padrão)
REVOKE ALL ON TABLE
  public.parties,
  public.party_invites,
  public.party_members,
  public.party_characters
FROM anon, authenticated, service_role;

GRANT SELECT, INSERT, DELETE ON TABLE public.parties TO authenticated;
GRANT UPDATE (name) ON TABLE public.parties TO authenticated;
GRANT SELECT ON TABLE public.party_invites TO authenticated;
GRANT UPDATE (code) ON TABLE public.party_invites TO authenticated;
GRANT SELECT, DELETE ON TABLE public.party_members TO authenticated;
GRANT UPDATE (status) ON TABLE public.party_members TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.party_characters TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.parties,
  public.party_invites,
  public.party_members,
  public.party_characters
TO service_role;
