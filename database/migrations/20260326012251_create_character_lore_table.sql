-- Criar a tabela public.character_lore
CREATE TABLE public.character_lore (
  character_id        UUID           PRIMARY KEY REFERENCES public.characters (id) ON DELETE CASCADE,
  
  -- Características Físicas
  age                 TEXT,
  height              TEXT,
  weight              TEXT,
  eyes                TEXT,
  skin                TEXT,
  hair                TEXT,
  
  -- Personalidade e Identidade
  personality_traits  TEXT,
  ideals              TEXT,
  bonds               TEXT,
  flaws               TEXT,
  
  -- Narrativa e Extras
  backstory           TEXT,
  allies_and_enemies  TEXT,
  organizations       TEXT,
  treasure            TEXT,

  -- Auditoria
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Índices para busca rápida
CREATE INDEX idx_character_lore_character_id ON public.character_lore(character_id);

-- Trigger de updated_at
CREATE TRIGGER trg_character_lore_updated_at
  BEFORE UPDATE ON public.character_lore
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Row Level Security (RLS)
ALTER TABLE public.character_lore ENABLE ROW LEVEL SECURITY;

-- Policies: O dono do personagem no characters tem permissão no lore
CREATE POLICY "character_lore_select_owner" 
  ON public.character_lore FOR SELECT 
  USING ( 
    EXISTS (
      SELECT 1 FROM public.characters 
      WHERE characters.id = character_lore.character_id 
      AND characters.owner_id = auth.uid()
    )
  );

CREATE POLICY "character_lore_insert_owner" 
  ON public.character_lore FOR INSERT 
  WITH CHECK ( 
    EXISTS (
      SELECT 1 FROM public.characters 
      WHERE characters.id = character_lore.character_id 
      AND characters.owner_id = auth.uid()
    )
  );

CREATE POLICY "character_lore_update_owner" 
  ON public.character_lore FOR UPDATE 
  USING ( 
    EXISTS (
      SELECT 1 FROM public.characters 
      WHERE characters.id = character_lore.character_id 
      AND characters.owner_id = auth.uid()
    )
  );

CREATE POLICY "character_lore_delete_owner" 
  ON public.character_lore FOR DELETE 
  USING ( 
    EXISTS (
      SELECT 1 FROM public.characters 
      WHERE characters.id = character_lore.character_id 
      AND characters.owner_id = auth.uid()
    )
  );
