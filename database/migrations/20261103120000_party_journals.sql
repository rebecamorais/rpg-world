-- Diário da mesa: o ID do Google Doc que o mestre colou. O app guarda só o ID, nunca o texto.
-- O mestre grava; o mestre e os jogadores ativos leem. Convidados e quem pediu para entrar não.

CREATE TABLE public.party_journals (
  party_id    uuid         PRIMARY KEY REFERENCES public.parties (id) ON DELETE CASCADE,
  doc_id      text         NOT NULL CHECK (doc_id ~ '^[A-Za-z0-9_-]{20,100}$'),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_party_journals_updated_at
  BEFORE UPDATE ON public.party_journals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.party_journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "party_journals_select_gm_or_member"
  ON public.party_journals FOR SELECT
  USING (private.is_party_gm(party_id) OR private.is_party_member(party_id));

CREATE POLICY "party_journals_insert_gm"
  ON public.party_journals FOR INSERT
  WITH CHECK (private.is_party_gm(party_id));

CREATE POLICY "party_journals_update_gm"
  ON public.party_journals FOR UPDATE
  USING (private.is_party_gm(party_id))
  WITH CHECK (private.is_party_gm(party_id));

CREATE POLICY "party_journals_delete_gm"
  ON public.party_journals FOR DELETE
  USING (private.is_party_gm(party_id));

-- Grants (a migração 20261020130000 revoga por padrão)
REVOKE ALL ON TABLE public.party_journals FROM anon, authenticated, service_role;

GRANT SELECT, INSERT, DELETE ON TABLE public.party_journals TO authenticated;
GRANT UPDATE (doc_id) ON TABLE public.party_journals TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.party_journals TO service_role;
