DO $$
DECLARE
  player_id UUID := gen_random_uuid();
  char_id   UUID := gen_random_uuid();
BEGIN
  -- =========================================================
  -- Idempotência: limpa dados existentes para este email
  -- =========================================================
  DELETE FROM auth.identities
    WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'player@email.com');
  DELETE FROM auth.users WHERE email = 'player@email.com';

  -- =========================================================
  -- 1. Criar usuário auth
  -- =========================================================
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    phone, phone_change, phone_change_token, email_change_token_current
  ) VALUES (
    player_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'player@email.com', crypt('player123', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Player One"}',
    now(), now(),
    '', '', '', '',
    NULL, '', '', ''
  );

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), player_id,
    jsonb_build_object('sub', player_id, 'email', 'player@email.com'),
    'email', player_id, now(), now(), now()
  );

  -- =========================================================
  -- 2. Criar personagem — Alatar, o Sábio (Mago nível 5)
  -- =========================================================
  INSERT INTO public.characters (
    id, owner_id, name, system, level,
    hp_current, hp_max,
    attributes, system_data,
    created_at, updated_at
  ) VALUES (
    char_id,
    player_id,
    'Alatar, o Sábio',
    'dnd_5e',
    5,
    32, 32, -- HP: 6 (base) + 2*CON per level + 8 (1st level)
    jsonb_build_object(
      'STR', 8,
      'DEX', 14,
      'CON', 14,
      'INT', 18,
      'WIS', 12,
      'CHA', 10
    ),
    jsonb_build_object(
      -- Identidade
      'race',       'Humano',
      'class',      'Mago',
      'subclass',   'Escola de Evocação',
      'background', 'Sábio',
      'alignment',  'Neutro e Bom',
      'xp',         6500,

      -- Combate
      'hpCurrent',  32,
      'hpMax',      32,
      'hpTemp',     0,
      'ac',         12,   -- 10 + DEX mod (sem armadura)
      'speed',      9,    -- 9 metros
      'initiative', 2,    -- DEX mod

      -- Dados de vida
      'hitDice', jsonb_build_object('total', '5d6', 'current', 5),
      'deathSaves', jsonb_build_object('successes', 0, 'failures', 0),

      -- Percepção
      'passivePerception', 11,

      -- Proficiências de saving throw (Mago: INT e WIS)
      'savingThrowProficiencies', jsonb_build_object(
        'STR', false, 'DEX', false, 'CON', false,
        'INT', true,  'WIS', true,  'CHA', false
      ),

      -- Skills (proficientes: Arcana, História, Investigação, Medicina)
      'skills', jsonb_build_object(
        'arcana',      jsonb_build_object('isProficient', true),
        'history',     jsonb_build_object('isProficient', true),
        'investigation', jsonb_build_object('isProficient', true),
        'medicine',    jsonb_build_object('isProficient', true)
      ),

      -- Conjuração
      'spellcastingSystem',  'slots',
      'spellcastingAbility', 'INT',
      'spellSaveDc',         15,   -- 8 + prof(3) + INT mod(4)
      'spellAttackBonus',    7,    -- prof(3) + INT mod(4)
      'spellSlots', jsonb_build_object(
        '1', jsonb_build_object('max', 4, 'used', 0),
        '2', jsonb_build_object('max', 3, 'used', 0),
        '3', jsonb_build_object('max', 2, 'used', 0)
      ),

      -- Moedas
      'coins', jsonb_build_object('cp', 0, 'sp', 50, 'ep', 0, 'gp', 120, 'pp', 0),

      -- Lore
      'personalityTraits', 'Falo sem parar sobre minha área de pesquisa favorita.',
      'ideals',  'Conhecimento — o caminho para a iluminação está no estudo constante.',
      'bonds',   'Meu grimório é meu bem mais precioso.',
      'flaws',   'Costumo ignorar perigos em favor de explorar ruínas antigas.'
    ),
    now(), now()
  );

  -- =========================================================
  -- 3. Associar magias conhecidas ao personagem
  --    Todas marcadas como preparadas (is_prepared = true)
  -- =========================================================

  -- Truques (nível 0)
  INSERT INTO public.character_spells (character_id, spell_id, is_prepared)
  SELECT char_id, id, true FROM public.spells WHERE external_index = 'prestidigitation'
  ON CONFLICT DO NOTHING;

  INSERT INTO public.character_spells (character_id, spell_id, is_prepared)
  SELECT char_id, id, true FROM public.spells WHERE external_index = 'mage-hand'
  ON CONFLICT DO NOTHING;

  INSERT INTO public.character_spells (character_id, spell_id, is_prepared)
  SELECT char_id, id, true FROM public.spells WHERE external_index = 'acid-splash'
  ON CONFLICT DO NOTHING;

  INSERT INTO public.character_spells (character_id, spell_id, is_prepared)
  SELECT char_id, id, true FROM public.spells WHERE external_index = 'chill-touch'
  ON CONFLICT DO NOTHING;

  -- 1º círculo
  INSERT INTO public.character_spells (character_id, spell_id, is_prepared)
  SELECT char_id, id, true FROM public.spells WHERE external_index = 'magic-missile'
  ON CONFLICT DO NOTHING;

  INSERT INTO public.character_spells (character_id, spell_id, is_prepared)
  SELECT char_id, id, true FROM public.spells WHERE external_index = 'shield'
  ON CONFLICT DO NOTHING;

  INSERT INTO public.character_spells (character_id, spell_id, is_prepared)
  SELECT char_id, id, true FROM public.spells WHERE external_index = 'mage-armor'
  ON CONFLICT DO NOTHING;

  INSERT INTO public.character_spells (character_id, spell_id, is_prepared)
  SELECT char_id, id, true FROM public.spells WHERE external_index = 'burning-hands'
  ON CONFLICT DO NOTHING;

  -- 2º círculo
  INSERT INTO public.character_spells (character_id, spell_id, is_prepared)
  SELECT char_id, id, true FROM public.spells WHERE external_index = 'blur'
  ON CONFLICT DO NOTHING;

  INSERT INTO public.character_spells (character_id, spell_id, is_prepared)
  SELECT char_id, id, false FROM public.spells WHERE external_index = 'blindness-deafness'
  ON CONFLICT DO NOTHING;

  -- 3º círculo
  INSERT INTO public.character_spells (character_id, spell_id, is_prepared)
  SELECT char_id, id, true FROM public.spells WHERE external_index = 'fireball'
  ON CONFLICT DO NOTHING;

  INSERT INTO public.character_spells (character_id, spell_id, is_prepared)
  SELECT char_id, id, false FROM public.spells WHERE external_index = 'blink'
  ON CONFLICT DO NOTHING;

END $$;
