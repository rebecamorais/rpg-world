-- Se um e-mail já tem conta. O cadastro e o link mágico perguntavam isso listando todos os
-- usuários pela API admin (1000 por página), o que cresce com a base; aqui é uma busca no índice
-- único de e-mail (users_email_partial_key). O Auth grava o e-mail em minúsculas.
--
-- SECURITY DEFINER porque o service_role não lê auth.users. Só o service_role executa (o backend
-- chama com o cliente admin); para a chave pública e o usuário logado ela não existe, senão
-- serviria para descobrir quem tem conta.
CREATE FUNCTION public.auth_user_exists(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = lower(trim(p_email)) AND is_sso_user = false
  );
$$;

REVOKE ALL ON FUNCTION public.auth_user_exists(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_exists(text) TO service_role;
