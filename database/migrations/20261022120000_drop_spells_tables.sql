-- The official spells live in content files (content/dnd5e) since 20261021120000, and nothing
-- reads these tables anymore. User-made spells will come with homebrew, in a table of their own.
BEGIN;

DROP TABLE public.spell_translations;
DROP TABLE public.spells;

COMMIT;
