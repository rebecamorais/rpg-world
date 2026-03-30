-- 1. Create Spells Table (Technical Data)
CREATE TABLE public.spells (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_index  TEXT UNIQUE, -- ex: 'fireball'
  system          rpg_system NOT NULL DEFAULT 'dnd_5e',
  level           SMALLINT NOT NULL,
  school          TEXT, -- key for i18n
  casting_time    TEXT, -- key for i18n
  casting_value   INT,
  
  -- Structured Mechanic Data
  range_value     INT,
  range_unit      TEXT, -- 'feet', 'touch', 'self', 'mile', 'unlimited'
  duration_value  INT,
  duration_unit   TEXT, -- 'instantaneous', 'minute', 'hour', 'day', 'special'
  
  concentration   BOOLEAN DEFAULT false,
  ritual          BOOLEAN DEFAULT false,
  components      TEXT[],
  classes         TEXT[], -- Array of slugs (wizard, cleric, etc)

  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Spell Translations Table
CREATE TABLE public.spell_translations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spell_id      UUID REFERENCES public.spells(id) ON DELETE CASCADE,
  locale        TEXT NOT NULL, -- 'pt' ou 'en'
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  higher_level  TEXT,
  material      TEXT, -- Localized material components
  is_verified   BOOLEAN DEFAULT true,

  
  UNIQUE(spell_id, locale)
);

-- 3. Junction Table: Character Spells
CREATE TABLE public.character_spells (
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
  spell_id     UUID REFERENCES public.spells(id) ON DELETE CASCADE,
  is_prepared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (character_id, spell_id)
);

-- 4. Enable RLS
ALTER TABLE public.spells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spell_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_spells ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Everyone can read spells/translations
DROP POLICY IF EXISTS "public_read_spells" ON public.spells;
DROP POLICY IF EXISTS "public_read_spell_translations" ON public.spell_translations;
CREATE POLICY "public_read_spells" ON public.spells FOR SELECT USING (true);
CREATE POLICY "public_read_spell_translations" ON public.spell_translations FOR SELECT USING (true);

-- 6. Character Spells: Only owner can read/write
DROP POLICY IF EXISTS "owner_can_manage_character_spell" ON public.character_spells;
CREATE POLICY "owner_can_manage_character_spell" ON public.character_spells
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.characters
    WHERE public.characters.id = character_id
    AND public.characters.owner_id = (select auth.uid())
  )
);
