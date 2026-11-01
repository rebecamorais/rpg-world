-- Duplicar uma ficha (por exemplo, um goblin chefe a partir do goblin). Vale para qualquer ficha
-- do dono, pc ou npc.
--
-- SECURITY INVOKER: o RLS de dono vale para a leitura e para as cópias, então o mestre não copia a
-- ficha de um jogador que ele só lê. A cópia leva a ficha, a lore e as magias; não leva o avatar,
-- porque o arquivo é do original e é removido quando ele for apagado.
CREATE FUNCTION public.duplicate_character(p_character_id uuid, p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.characters (
    owner_id, name, system, level, attributes, system_data, hp_current, hp_max, theme_color, kind
  )
  SELECT owner_id, p_name, system, level, attributes, system_data, hp_current, hp_max,
         theme_color, kind
  FROM public.characters
  WHERE id = p_character_id AND owner_id = (SELECT auth.uid()) AND deleted_at IS NULL
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'character_not_found', ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.character_lore (
    character_id, age, height, weight, eyes, skin, hair, personality_traits, ideals, bonds, flaws,
    backstory, allies_and_enemies, organizations, treasure
  )
  SELECT v_id, age, height, weight, eyes, skin, hair, personality_traits, ideals, bonds, flaws,
         backstory, allies_and_enemies, organizations, treasure
  FROM public.character_lore
  WHERE character_id = p_character_id;

  INSERT INTO public.character_spells (character_id, spell_ref, is_prepared)
  SELECT v_id, spell_ref, is_prepared
  FROM public.character_spells
  WHERE character_id = p_character_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.duplicate_character(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.duplicate_character(uuid, text) TO authenticated, service_role;
