-- Add theme_color column to characters table
-- Stores the character's accent/theme color as a validated hex string.
-- Default: Rebs Tech Studio purple (#663399)
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#663399'
  CHECK (theme_color ~ '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$');