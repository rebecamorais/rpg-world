-- A arte por trás da ficha, enviada pelo dono do personagem. O nome evita confusão com o antecedente
-- de D&D, o campo `background` em system_data. Não é copiada ao duplicar um personagem: o arquivo
-- pertence a este personagem e é apagado junto com ele.
ALTER TABLE public.characters ADD COLUMN sheet_background_url TEXT;

-- O job diário apaga o que o banco não cita: sem esta regra, levaria os fundos em uso.
-- Parte da versão de 20261106210000_orphan_avatar_full_images.sql e só acrescenta a coluna nova.
CREATE OR REPLACE FUNCTION public.orphan_avatar_objects(min_age INTERVAL DEFAULT INTERVAL '1 day')
RETURNS SETOF TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT o.name
  FROM storage.objects AS o
  CROSS JOIN LATERAL (
    SELECT regexp_replace(o.name, '(\.[^./]+)$', '-avatar\1') AS name
  ) AS avatar
  WHERE o.bucket_id = 'avatars'
    AND o.created_at < now() - min_age
    AND NOT EXISTS (
      SELECT 1 FROM public.profile AS p
      WHERE right(p.avatar_url, char_length('/avatars/' || o.name)) = '/avatars/' || o.name
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.characters AS c
      WHERE right(c.avatar_url, char_length('/avatars/' || o.name)) = '/avatars/' || o.name
         OR right(c.avatar_url, char_length('/avatars/' || avatar.name)) = '/avatars/' || avatar.name
         OR right(c.sheet_background_url, char_length('/avatars/' || o.name)) = '/avatars/' || o.name
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.parties AS pa
      WHERE right(pa.image_url, char_length('/avatars/' || o.name)) = '/avatars/' || o.name
    )
    AND NOT EXISTS (
      SELECT 1 FROM storage.objects AS recent
      WHERE recent.bucket_id = 'avatars'
        AND recent.name = avatar.name
        AND recent.created_at >= now() - min_age
    )
  ORDER BY o.created_at;
$$;
