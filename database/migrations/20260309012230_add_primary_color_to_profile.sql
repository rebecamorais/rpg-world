-- Adicionar coluna primary_color ao perfil do usuário
ALTER TABLE public.profile
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#663399';
