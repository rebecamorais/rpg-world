-- Baú da party e imagem da mesa.
--
-- 1. Toda mesa tem um baú (party_chest): trigger para as novas, carga para as que já existem. O
--    lugar, o RLS e os limites já vêm de 20261102201453_inventory.sql (o mestre e os membros ativos
--    leem e escrevem; o baú não se apaga a não ser junto com a mesa).
-- 2. A imagem da mesa: a URL de um arquivo no bucket 'avatars', na pasta do mestre. Só o mestre
--    muda (o RLS de UPDATE de parties já é só dele).
-- 3. O card do convite: nome e imagem da mesa pelo código, para quem ainda não entrou na conta
--    (é o que o Discord e o WhatsApp mostram quando alguém cola o link). Nada mais da mesa sai.
-- 4. A limpeza de arquivos órfãos passa a contar a imagem da mesa como usada.

-- 1. Baú da party

CREATE FUNCTION private.create_party_chest()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.containers (party_id, kind) VALUES (NEW.id, 'party_chest');
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_parties_party_chest
  AFTER INSERT ON public.parties
  FOR EACH ROW
  EXECUTE FUNCTION private.create_party_chest();

INSERT INTO public.containers (party_id, kind)
SELECT p.id, 'party_chest'
FROM public.parties AS p
WHERE NOT EXISTS (
  SELECT 1 FROM public.containers AS c
  WHERE c.party_id = p.id AND c.kind = 'party_chest'
);

REVOKE ALL ON FUNCTION private.create_party_chest() FROM PUBLIC, anon, authenticated;

-- 2. Imagem da mesa

ALTER TABLE public.parties
  ADD COLUMN image_url text CHECK (char_length(image_url) <= 500);

GRANT UPDATE (image_url) ON TABLE public.parties TO authenticated;

-- 3. Card do convite
--
-- SECURITY DEFINER: quem chama ainda não vê a mesa pelo RLS. O código tem 32 caracteres
-- aleatórios e o mestre pode trocá-lo; sem ele, nada é revelado.
CREATE FUNCTION public.party_invite_card(p_code text)
RETURNS TABLE (name text, image_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.name, p.image_url
  FROM public.party_invites AS i
  JOIN public.parties AS p ON p.id = i.party_id
  WHERE i.code = p_code;
$$;

REVOKE ALL ON FUNCTION public.party_invite_card(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.party_invite_card(text) TO anon, authenticated, service_role;

-- 4. Arquivos órfãos

CREATE OR REPLACE FUNCTION public.orphan_avatar_objects(min_age INTERVAL DEFAULT INTERVAL '1 day')
RETURNS SETOF TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT o.name
  FROM storage.objects AS o
  WHERE o.bucket_id = 'avatars'
    AND o.created_at < now() - min_age
    AND NOT EXISTS (
      SELECT 1 FROM public.profile AS p
      WHERE right(p.avatar_url, char_length('/avatars/' || o.name)) = '/avatars/' || o.name
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.characters AS c
      WHERE right(c.avatar_url, char_length('/avatars/' || o.name)) = '/avatars/' || o.name
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.parties AS pa
      WHERE right(pa.image_url, char_length('/avatars/' || o.name)) = '/avatars/' || o.name
    )
  ORDER BY o.created_at;
$$;
