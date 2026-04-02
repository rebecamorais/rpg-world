-- Add metadata fields to spells table
ALTER TABLE public.spells 
ADD COLUMN IF NOT EXISTS material_cost INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_scaling BOOLEAN DEFAULT FALSE;
