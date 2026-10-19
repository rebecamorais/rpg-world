-- Remove a leitura pública dos objetos do bucket 'avatars'.
-- "avatar_select_public" liberava SELECT em todo o bucket para qualquer um, e é essa policy que
-- autoriza a listagem do Storage: com a chave publicável dava para listar o bucket inteiro (os
-- UUIDs de todos os usuários e personagens e até os avatares já substituídos).
-- Bucket público não precisa de policy de SELECT para servir arquivos: o /api/images busca pelo
-- endpoint público (/object/public/avatars/...), que não consulta o RLS.
-- O dono continua lendo a própria pasta, porque o upload com upsert também exige SELECT.
DROP POLICY IF EXISTS "avatar_select_public" ON storage.objects;

CREATE POLICY "avatar_select_own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );
