-- A imagem de um personagem agora são dois arquivos: <nome>.<ext>, a imagem completa, e
-- <nome>-avatar.<ext>, o recorte. O banco só cita o recorte, então sem esta regra o job diário
-- apagaria toda imagem completa em uso.
--
-- Um arquivo é poupado quando o <nome>-avatar.<ext> dele está em uso ou ainda é recente demais para
-- ser órfão. A imagem completa é gravada antes do avatar, então por um instante pode já ter a idade
-- mínima enquanto o par ainda não tem. Imagens antigas não têm par: seguem a regra de sempre, e a
-- de uma conta excluída continua sendo removida.
--
-- Parte da versão de 20261103190000_party_chest_and_image.sql, que também protege as imagens das
-- mesas. Só muda a função: nenhuma tabela nem dado é alterado.

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
