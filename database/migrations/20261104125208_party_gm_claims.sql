-- Virar o novo mestre de uma mesa sem mestre: um jogador ativo pede e os outros ativos aceitam.
--
-- - party_gm_claims: o pedido, um por mesa. party_gm_claim_votes: só as aceitações; recusar apaga o
--   pedido. Os dois FKs para party_members fazem o pedido e o voto saírem junto com quem saiu.
-- - Só funções SECURITY DEFINER mexem nessas tabelas. O novo mestre passa a ler fichas completas,
--   então nenhum atalho pela API pode trocar o candidato ou inventar um voto.
-- - Ordem única de bloqueio: toda função que pede, vota, cancela ou tira alguém começa pela linha da
--   mesa, FOR NO KEY UPDATE, o mesmo modo de after_party_member_removed. É o que faz dois votos
--   simultâneos se enxergarem: sem isso, cada um veria o outro ainda pendente e ninguém aprovaria.
-- - O conjunto de quem vota é estável: ninguém fica ativo numa mesa sem mestre
--   (block_join_without_gm) e ativo não volta a outro status. Só sair muda o conjunto, e a saída
--   reavalia o pedido.
--
-- Também corrige, em cima de 20261104123642_party_without_gm.sql:
-- - after_party_member_removed: quem não é ativo não vota nem mantém a mesa viva, e não precisa do
--   bloqueio, que ainda podia dar deadlock com a mesa sendo apagada.
-- - block_join_without_gm: lê gm_id FOR SHARE, para o convidado que aceita esperar a exclusão do
--   mestre em andamento em vez de entrar na mesa que acabou de ficar sem mestre.
-- - request_party_join: quem já é ativo ou já pediu recebe o próprio status; recusa só quem entraria.

-- 1. Tabelas
CREATE TABLE public.party_gm_claims (
  party_id      uuid         PRIMARY KEY,
  candidate_id  uuid         NOT NULL,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  FOREIGN KEY (party_id, candidate_id)
    REFERENCES public.party_members (party_id, user_id) ON DELETE CASCADE
);

CREATE TABLE public.party_gm_claim_votes (
  party_id    uuid         NOT NULL REFERENCES public.party_gm_claims (party_id) ON DELETE CASCADE,
  user_id     uuid         NOT NULL,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (party_id, user_id),
  FOREIGN KEY (party_id, user_id)
    REFERENCES public.party_members (party_id, user_id) ON DELETE CASCADE
);

ALTER TABLE public.party_gm_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_gm_claim_votes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.party_gm_claims, public.party_gm_claim_votes
  FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.party_gm_claims, public.party_gm_claim_votes
  TO service_role;

-- 2. Conferir o pedido. Quem chama já bloqueou a linha da mesa e sabe que há pedido aberto.
--    O lock por mestre é o mesmo de check_party_gm_limit, que só roda em INSERT: sem ele, uma mesa
--    criada agora (ou outro pedido aprovado) passaria junto pela contagem.
--    A ordem importa: com gm_id já preenchido, tirar o candidato de party_members não apaga a mesa
--    em after_party_member_removed, e sem o pedido não há nada a reavaliar.
CREATE FUNCTION private.settle_party_gm_claim(p_party_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_candidate_id uuid;
BEGIN
  SELECT candidate_id INTO v_candidate_id
  FROM public.party_gm_claims WHERE party_id = p_party_id;

  IF EXISTS (
    SELECT 1 FROM public.party_members AS m
    WHERE m.party_id = p_party_id
      AND m.status = 'active'
      AND m.user_id <> v_candidate_id
      AND NOT EXISTS (
        SELECT 1 FROM public.party_gm_claim_votes AS v
        WHERE v.party_id = m.party_id AND v.user_id = m.user_id
      )
  ) THEN
    RETURN 'pending';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('party_gm_limit:' || v_candidate_id::text));
  IF (SELECT count(*) FROM public.parties WHERE gm_id = v_candidate_id) >= 5 THEN
    DELETE FROM public.party_gm_claims WHERE party_id = p_party_id;
    RETURN 'cancelled';
  END IF;

  UPDATE public.parties SET gm_id = v_candidate_id WHERE id = p_party_id;
  DELETE FROM public.party_gm_claims WHERE party_id = p_party_id;
  DELETE FROM public.party_members WHERE party_id = p_party_id AND user_id = v_candidate_id;
  RETURN 'approved';
END;
$$;

REVOKE ALL ON FUNCTION private.settle_party_gm_claim(uuid) FROM PUBLIC, anon, authenticated;

-- 3. Quando um membro sai, o pedido é reavaliado. Quando quem saiu é o candidato, o FK já apagou o
--    pedido: os gatilhos de FK se chamam RI_ConstraintTrigger_* e rodam antes deste, em ordem de nome.
CREATE OR REPLACE FUNCTION private.after_party_member_removed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_gm_id uuid;
BEGIN
  IF OLD.status <> 'active' THEN
    RETURN NULL;
  END IF;

  SELECT gm_id INTO v_gm_id FROM public.parties WHERE id = OLD.party_id FOR NO KEY UPDATE;
  IF NOT FOUND OR v_gm_id IS NOT NULL THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.party_members
    WHERE party_id = OLD.party_id AND status = 'active'
  ) THEN
    DELETE FROM public.parties WHERE id = OLD.party_id;
  ELSIF EXISTS (SELECT 1 FROM public.party_gm_claims WHERE party_id = OLD.party_id) THEN
    PERFORM private.settle_party_gm_claim(OLD.party_id);
  END IF;
  RETURN NULL;
END;
$$;

-- 4. Ninguém entra sem mestre, nem no meio da exclusão do mestre. Mesa que sumiu também recusa.
CREATE OR REPLACE FUNCTION private.block_join_without_gm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_gm_id uuid;
BEGIN
  SELECT gm_id INTO v_gm_id FROM public.parties WHERE id = NEW.party_id FOR SHARE;
  IF v_gm_id IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'party_without_gm', ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
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
    SELECT status INTO v_status FROM public.party_members
    WHERE party_id = v_party_id AND user_id = v_uid;
    IF v_status IN ('active', 'requested') THEN
      RETURN v_status;
    END IF;
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

-- 5. Pedir. O lock por mestre fica até o fim da transação, então a conferência de settle não muda
--    de resposta: um jogador único que passou daqui vira mestre.
CREATE FUNCTION public.claim_party_gm(p_party_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_gm_id uuid;
BEGIN
  SELECT gm_id INTO v_gm_id FROM public.parties WHERE id = p_party_id FOR NO KEY UPDATE;

  IF NOT EXISTS (
    SELECT 1 FROM public.party_members
    WHERE party_id = p_party_id AND user_id = v_uid AND status = 'active'
  ) THEN
    RAISE EXCEPTION USING MESSAGE = 'party_not_active_member', ERRCODE = 'P0001';
  END IF;
  IF v_gm_id IS NOT NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'party_has_gm', ERRCODE = 'P0001';
  END IF;
  IF EXISTS (SELECT 1 FROM public.party_gm_claims WHERE party_id = p_party_id) THEN
    RAISE EXCEPTION USING MESSAGE = 'party_claim_exists', ERRCODE = 'P0001';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('party_gm_limit:' || v_uid::text));
  IF (SELECT count(*) FROM public.parties WHERE gm_id = v_uid) >= 5 THEN
    RAISE EXCEPTION USING MESSAGE = 'party_gm_limit', ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.party_gm_claims (party_id, candidate_id) VALUES (p_party_id, v_uid);
  RETURN private.settle_party_gm_claim(p_party_id);
END;
$$;

-- 6. Votar. Quem não é ativo recebe party_cannot_vote antes de tudo, para não descobrir se há pedido.
CREATE FUNCTION public.vote_party_gm_claim(p_party_id uuid, p_accept boolean)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_candidate_id uuid;
BEGIN
  PERFORM 1 FROM public.parties WHERE id = p_party_id FOR NO KEY UPDATE;

  IF NOT EXISTS (
    SELECT 1 FROM public.party_members
    WHERE party_id = p_party_id AND user_id = v_uid AND status = 'active'
  ) THEN
    RAISE EXCEPTION USING MESSAGE = 'party_cannot_vote', ERRCODE = 'P0001';
  END IF;

  SELECT candidate_id INTO v_candidate_id
  FROM public.party_gm_claims WHERE party_id = p_party_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING MESSAGE = 'party_claim_not_found', ERRCODE = 'P0001';
  END IF;
  IF v_candidate_id = v_uid THEN
    RAISE EXCEPTION USING MESSAGE = 'party_cannot_vote', ERRCODE = 'P0001';
  END IF;

  IF NOT p_accept THEN
    DELETE FROM public.party_gm_claims WHERE party_id = p_party_id;
    RETURN 'cancelled';
  END IF;

  INSERT INTO public.party_gm_claim_votes (party_id, user_id)
  VALUES (p_party_id, v_uid)
  ON CONFLICT (party_id, user_id) DO NOTHING;
  RETURN private.settle_party_gm_claim(p_party_id);
END;
$$;

-- 7. Desistir: só quem pediu
CREATE FUNCTION public.cancel_party_gm_claim(p_party_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM 1 FROM public.parties WHERE id = p_party_id FOR NO KEY UPDATE;

  DELETE FROM public.party_gm_claims
  WHERE party_id = p_party_id AND candidate_id = (SELECT auth.uid());
  IF NOT FOUND THEN
    RAISE EXCEPTION USING MESSAGE = 'party_claim_not_found', ERRCODE = 'P0001';
  END IF;
END;
$$;

-- 8. O que a página da mesa mostra, só aos ativos. Sem e-mail; nome só se a pessoa escolheu um.
CREATE FUNCTION public.party_gm_claim(p_party_id uuid)
RETURNS TABLE (
  candidate_id uuid,
  candidate_username text,
  created_at timestamptz,
  pending_user_ids uuid[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    c.candidate_id,
    CASE WHEN candidate.username_chosen THEN candidate.username END,
    c.created_at,
    ARRAY(
      SELECT m.user_id FROM public.party_members AS m
      WHERE m.party_id = c.party_id
        AND m.status = 'active'
        AND m.user_id <> c.candidate_id
        AND NOT EXISTS (
          SELECT 1 FROM public.party_gm_claim_votes AS v
          WHERE v.party_id = m.party_id AND v.user_id = m.user_id
        )
      ORDER BY m.created_at, m.user_id
    )
  FROM public.party_gm_claims AS c
  JOIN public.profile AS candidate ON candidate.id = c.candidate_id
  WHERE c.party_id = p_party_id AND private.is_party_member(p_party_id);
$$;

-- 9. Suporte: quem falta responder, com o e-mail, para escrever antes de tirar alguém. Uma linha por
--    pendência. SECURITY DEFINER porque o service_role não lê auth.users.
CREATE FUNCTION public.support_party_gm_claim(p_party_id uuid)
RETURNS TABLE (
  candidate_id uuid,
  created_at timestamptz,
  pending_user_id uuid,
  pending_email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT c.candidate_id, c.created_at, m.user_id, u.email::text
  FROM public.party_gm_claims AS c
  JOIN public.party_members AS m
    ON m.party_id = c.party_id AND m.status = 'active' AND m.user_id <> c.candidate_id
  JOIN auth.users AS u ON u.id = m.user_id
  WHERE c.party_id = p_party_id
    AND NOT EXISTS (
      SELECT 1 FROM public.party_gm_claim_votes AS v
      WHERE v.party_id = m.party_id AND v.user_id = m.user_id
    )
  ORDER BY m.created_at, m.user_id;
$$;

-- Tira quem não responde. Quem reavalia é o gatilho da saída, como em qualquer outra saída; o
-- retorno só lê o que ficou. O candidato continua ativo, então a mesa não some aqui.
CREATE FUNCTION public.support_remove_unresponsive_member(p_party_id uuid, p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM 1 FROM public.parties WHERE id = p_party_id FOR NO KEY UPDATE;

  IF NOT EXISTS (SELECT 1 FROM public.party_gm_claims WHERE party_id = p_party_id) THEN
    RAISE EXCEPTION USING MESSAGE = 'party_claim_not_found', ERRCODE = 'P0001';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.support_party_gm_claim(p_party_id) AS s
    WHERE s.pending_user_id = p_user_id
  ) THEN
    RAISE EXCEPTION USING MESSAGE = 'party_cannot_vote', ERRCODE = 'P0001';
  END IF;

  DELETE FROM public.party_members WHERE party_id = p_party_id AND user_id = p_user_id;

  IF EXISTS (SELECT 1 FROM public.party_gm_claims WHERE party_id = p_party_id) THEN
    RETURN 'pending';
  END IF;
  IF EXISTS (SELECT 1 FROM public.parties WHERE id = p_party_id AND gm_id IS NOT NULL) THEN
    RETURN 'approved';
  END IF;
  RETURN 'cancelled';
END;
$$;

-- 10. Grants
REVOKE ALL ON FUNCTION
  public.claim_party_gm(uuid),
  public.vote_party_gm_claim(uuid, boolean),
  public.cancel_party_gm_claim(uuid),
  public.party_gm_claim(uuid),
  public.support_party_gm_claim(uuid),
  public.support_remove_unresponsive_member(uuid, uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.claim_party_gm(uuid),
  public.vote_party_gm_claim(uuid, boolean),
  public.cancel_party_gm_claim(uuid),
  public.party_gm_claim(uuid)
TO authenticated;

GRANT EXECUTE ON FUNCTION
  public.support_party_gm_claim(uuid),
  public.support_remove_unresponsive_member(uuid, uuid)
TO service_role;
