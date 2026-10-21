-- Official spells moved to content files (content/dnd5e/srd-5.1): a character's spell now points
-- to the stable content key (dnd5e:srd-5.1:spell:fireball) instead of a row of public.spells.
-- public.spells and public.spell_translations stay, unread, until a later migration drops them.
BEGIN;

ALTER TABLE public.character_spells ADD COLUMN spell_ref TEXT;

UPDATE public.character_spells cs
SET spell_ref = 'dnd5e:srd-5.1:spell:' || s.external_index
FROM public.spells s
WHERE s.id = cs.spell_id;

-- The foreign key guaranteed a match; anything left has no spell to point to
DELETE FROM public.character_spells WHERE spell_ref IS NULL;

ALTER TABLE public.character_spells
  ALTER COLUMN spell_ref SET NOT NULL,
  ADD CONSTRAINT character_spells_spell_ref_format
    CHECK (spell_ref ~ '^dnd5e:[a-z0-9.-]+:spell:[a-z0-9-]+$' AND length(spell_ref) <= 200),
  DROP CONSTRAINT character_spells_pkey,
  ADD PRIMARY KEY (character_id, spell_ref),
  DROP COLUMN spell_id;

COMMIT;
