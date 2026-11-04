-- Voto sem resposta (NULL) não pode aprovar um novo mestre.
--
-- Em vote_party_gm_claim, `IF NOT p_accept` vale NULL quando p_accept é NULL, e o IF não entra:
-- o voto seguia como aceitação. Agora só TRUE aceita; NULL conta como recusa.
-- Mesma definição de 20261104125208_party_gm_claims.sql, mudando só essa conferência.

CREATE OR REPLACE FUNCTION public.vote_party_gm_claim(p_party_id uuid, p_accept boolean)
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

  IF p_accept IS NOT TRUE THEN
    DELETE FROM public.party_gm_claims WHERE party_id = p_party_id;
    RETURN 'cancelled';
  END IF;

  INSERT INTO public.party_gm_claim_votes (party_id, user_id)
  VALUES (p_party_id, v_uid)
  ON CONFLICT (party_id, user_id) DO NOTHING;
  RETURN private.settle_party_gm_claim(p_party_id);
END;
$$;
