-- Add damage_type to spells table
ALTER TABLE public.spells
ADD COLUMN damage_type TEXT;

ALTER TABLE public.spells 
ADD COLUMN IF NOT EXISTS bg_style_id TEXT DEFAULT 'dots-space';