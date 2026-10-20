-- Arquivos do bucket 'avatars' que nenhum perfil ou personagem usa.
-- Os uploads ficam guardados até o formulário ser salvo; quem envia e desiste (ou fecha a aba)
-- deixa o arquivo para trás. O job diário /api/cron/cleanup-avatars apaga esses arquivos pela API
-- do Storage (apagar a linha de storage.objects direto deixaria o arquivo no armazenamento).
--
-- O avatar salvo é uma URL que termina em /avatars/<caminho>, seja qual for o host
-- (images.rpgworldapp.com, /api/images ou a URL pública do Supabase).
-- min_age deixa de fora os envios recentes, que ainda podem estar esperando o formulário.

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
  ORDER BY o.created_at;
$$;

-- Só o job (service role) pode chamar: a lista mostraria arquivos de todos os usuários
REVOKE ALL ON FUNCTION public.orphan_avatar_objects(INTERVAL) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.orphan_avatar_objects(INTERVAL) TO service_role;
