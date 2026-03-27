-- Add avatar_url column to characters table
-- Stores the proxy URL for the character's avatar image
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;
