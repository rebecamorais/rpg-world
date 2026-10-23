-- Ajustes apontados pelos advisors do Supabase.

-- 1. As políticas da character_lore chamavam auth.uid() direto, e o Postgres reavalia a função
--    para cada linha (auth_rls_initplan). Entre parênteses com SELECT ela roda uma vez por
--    consulta, como já fazem characters, character_spells e profile. ALTER POLICY troca a
--    expressão no lugar, sem janela em que a tabela fique sem política.
ALTER POLICY "character_lore_select_owner" ON public.character_lore
  USING (EXISTS (
    SELECT 1 FROM public.characters
    WHERE characters.id = character_lore.character_id
      AND characters.owner_id = (SELECT auth.uid())
  ));

ALTER POLICY "character_lore_insert_owner" ON public.character_lore
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.characters
    WHERE characters.id = character_lore.character_id
      AND characters.owner_id = (SELECT auth.uid())
  ));

ALTER POLICY "character_lore_update_owner" ON public.character_lore
  USING (EXISTS (
    SELECT 1 FROM public.characters
    WHERE characters.id = character_lore.character_id
      AND characters.owner_id = (SELECT auth.uid())
  ));

ALTER POLICY "character_lore_delete_owner" ON public.character_lore
  USING (EXISTS (
    SELECT 1 FROM public.characters
    WHERE characters.id = character_lore.character_id
      AND characters.owner_id = (SELECT auth.uid())
  ));

-- 2. Repetia a chave primária (character_lore_pkey, também em character_id): só custava escrita.
DROP INDEX IF EXISTS public.idx_character_lore_character_id;

-- 3. Nenhuma consulta filtra personagens por system (e só existe dnd_5e).
DROP INDEX IF EXISTS public.idx_characters_system;

-- 4. Apagar um perfil faz ON DELETE SET NULL em feedback.user_id; sem índice, varre a tabela.
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback (user_id);
