-- 1. Criar o Enum para o sistema de RPG

DO $$ BEGIN
    CREATE TYPE public.rpg_system AS ENUM ('dnd_5e', 'ezd6', 'pathfinder_2e');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Criar a tabela public.characters
CREATE TABLE public.characters (
  id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  -- FK direta para o ID do usuário (Performance > String)
  owner_id     UUID           NOT NULL REFERENCES public.profile (id) ON DELETE CASCADE,
  name         TEXT           NOT NULL,
  system       rpg_system     NOT NULL DEFAULT 'dnd_5e',
  level        SMALLINT       NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 20),
  
  -- Stats dinâmicos via JSONB
  attributes   JSONB          NOT NULL DEFAULT '{}'::jsonb,
  system_data  JSONB          NOT NULL DEFAULT '{}'::jsonb,
  
  -- Pontos de Vida
  hp_current   SMALLINT       NOT NULL DEFAULT 1,
  hp_max       SMALLINT       NOT NULL DEFAULT 1,

  -- Auditoria
  deleted_at   TIMESTAMPTZ    DEFAULT NULL,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- 3. Índices para busca rápida
CREATE INDEX idx_characters_owner_id ON public.characters(owner_id);
CREATE INDEX idx_characters_system ON public.characters(system);

-- 4. Trigger de updated_at (reutilizando a função que criamos na migration de users)
CREATE TRIGGER trg_characters_updated_at
  BEFORE UPDATE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Row Level Security (RLS)
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Policies com nomenclatura técnica
CREATE POLICY "characters_select_owner" 
  ON public.characters FOR SELECT 
  USING ( (SELECT auth.uid()) = owner_id );

CREATE POLICY "characters_insert_owner" 
  ON public.characters FOR INSERT 
  WITH CHECK ( (SELECT auth.uid()) = owner_id );

CREATE POLICY "characters_update_owner" 
  ON public.characters FOR UPDATE 
  USING ( (SELECT auth.uid()) = owner_id );

CREATE POLICY "characters_delete_owner" 
  ON public.characters FOR DELETE 
  USING ( (SELECT auth.uid()) = owner_id );