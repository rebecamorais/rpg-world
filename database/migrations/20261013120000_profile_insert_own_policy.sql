-- O backend passou a acessar dados com o client do usuário (sujeito a RLS).
-- O perfil normalmente é criado pelo trigger handle_new_user, mas o callback de login
-- recria o perfil se ele não existir; sem esta policy esse fallback seria barrado.
CREATE POLICY "profile_insert_own"
  ON public.profile FOR INSERT
  WITH CHECK ( (SELECT auth.uid()) = id );
