-- Generated from the demo's data by `npm run seed:local`. Do not edit by hand.
-- Local development only: these accounts and passwords are public (see docs/ambiente-local.md).

-- Safe to run again: starts over from these accounts
DELETE FROM public.parties WHERE id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email IN ('mestre@email.com', 'playerchilli@email.com', 'playerpepper@email.com'));
DELETE FROM auth.users WHERE email IN ('mestre@email.com', 'playerchilli@email.com', 'playerpepper@email.com');

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  phone, phone_change, phone_change_token, email_change_token_current
) VALUES (
  'c0000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'mestre@email.com', crypt('mestre123', gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}', '{}',
  now(), now(),
  '', '', '', '',
  NULL, '', '', ''
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  gen_random_uuid(), 'c0000000-0000-4000-8000-000000000001',
  '{"sub":"c0000000-0000-4000-8000-000000000001","email":"mestre@email.com"}'::jsonb,
  'email', 'c0000000-0000-4000-8000-000000000001', now(), now(), now()
);
-- The sign-up trigger made the profile with a placeholder name; this one counts as chosen
UPDATE public.profile SET username = 'mestre', username_chosen = true WHERE id = 'c0000000-0000-4000-8000-000000000001';

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  phone, phone_change, phone_change_token, email_change_token_current
) VALUES (
  'c0000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'playerchilli@email.com', crypt('chilli123', gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}', '{}',
  now(), now(),
  '', '', '', '',
  NULL, '', '', ''
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  gen_random_uuid(), 'c0000000-0000-4000-8000-000000000002',
  '{"sub":"c0000000-0000-4000-8000-000000000002","email":"playerchilli@email.com"}'::jsonb,
  'email', 'c0000000-0000-4000-8000-000000000002', now(), now(), now()
);
-- The sign-up trigger made the profile with a placeholder name; this one counts as chosen
UPDATE public.profile SET username = 'playerChilli', username_chosen = true WHERE id = 'c0000000-0000-4000-8000-000000000002';

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  phone, phone_change, phone_change_token, email_change_token_current
) VALUES (
  'c0000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'playerpepper@email.com', crypt('pepper123', gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}', '{}',
  now(), now(),
  '', '', '', '',
  NULL, '', '', ''
);
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES (
  gen_random_uuid(), 'c0000000-0000-4000-8000-000000000003',
  '{"sub":"c0000000-0000-4000-8000-000000000003","email":"playerpepper@email.com"}'::jsonb,
  'email', 'c0000000-0000-4000-8000-000000000003', now(), now(), now()
);
-- The sign-up trigger made the profile with a placeholder name; this one counts as chosen
UPDATE public.profile SET username = 'playerPepper', username_chosen = true WHERE id = 'c0000000-0000-4000-8000-000000000003';

-- The Pioneers: no picture, since the database only takes one the GM uploaded
INSERT INTO public.parties (id, name, system, edition, gm_id)
VALUES ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'The Pioneers', 'dnd_5e', '2014', 'c0000000-0000-4000-8000-000000000001');
INSERT INTO public.party_members (party_id, user_id, status) VALUES
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'c0000000-0000-4000-8000-000000000002', 'active'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'c0000000-0000-4000-8000-000000000003', 'active');
UPDATE public.containers SET coins = '{"cp":0,"sp":40,"ep":0,"gp":250,"pp":0}'::jsonb WHERE party_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' AND kind = 'party_chest';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:rations-1-day', 12 FROM public.containers WHERE party_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' AND kind = 'party_chest';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:torch', 10 FROM public.containers WHERE party_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' AND kind = 'party_chest';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:hempen-rope-50-feet', 2 FROM public.containers WHERE party_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' AND kind = 'party_chest';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:oil-flask', 3 FROM public.containers WHERE party_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' AND kind = 'party_chest';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:holy-water-flask', 2 FROM public.containers WHERE party_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' AND kind = 'party_chest';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:healer-s-kit', 2 FROM public.containers WHERE party_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' AND kind = 'party_chest';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:two-person-tent', 1 FROM public.containers WHERE party_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' AND kind = 'party_chest';

-- Ada Lovelace
INSERT INTO public.characters (id, owner_id, name, system, kind, level, hp_current, hp_max, avatar_url, theme_color, attributes, system_data)
VALUES (
  'e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000003', 'Ada Lovelace', 'dnd_5e', 'pc', 4, 31, 31,
  '/demo/pioneers/arcane-architect.webp', '#8b5cf6',
  '{"STR":8,"DEX":14,"CON":14,"INT":17,"WIS":12,"CHA":10}'::jsonb,
  '{"race":"Humana","class":"Artífice","subclass":"Alquimista das Engrenagens","background":"Sábia","alignment":"NG","xp":2700,"hpTemp":0,"ac":14,"speed":30,"initiative":2,"hitDice":{"total":"4d8","current":4},"deathSaves":{"successes":0,"failures":0},"skills":{"ARCANA":{"isProficient":true},"INVESTIGATION":{"isProficient":true},"HISTORY":{"isProficient":true}},"savingThrowProficiencies":{"STR":false,"DEX":false,"CON":true,"INT":true,"WIS":false,"CHA":false},"passivePerception":11,"spellcastingSystem":"slots","spellcastingAbility":"INT","spellSaveDc":13,"spellAttackBonus":5,"spellSlots":{"1":{"max":3,"used":0}}}'::jsonb
);
INSERT INTO public.character_lore (character_id, age, height, weight, eyes, skin, hair, personality_traits, ideals, bonds, flaws, backstory, allies_and_enemies, organizations, treasure)
VALUES ('e0000000-0000-4000-8000-000000000001', '32 anos', '1,65 m', '58 kg', 'Castanho-escuros', 'Marrom-escura', 'Cachos pretos e volumosos, presos com engrenagens de latão', 'Curiosa, metódica, visionária', 'Conhecimento: todo mistério esconde uma linguagem à espera de ser compreendida.', 'Sua oficina e o motor que ela ainda não terminou de imaginar.', 'Perde a noção das horas, e do jantar, quando um padrão a chama.', 'Ada enxerga padrões onde os outros veem caos. Em sua oficina isolada, ela constrói intrincados mecanismos arcanos capazes de fazer cálculos, prever movimentos e dar vida a invenções impossíveis. Ela acredita que todo mistério do universo esconde uma linguagem à espera de ser compreendida.', 'Aliada: Katherine, que confere os números dela nas estrelas. Inimigo: o barão Ostrel, que quer transformar os motores dela em armas de cerco.', 'O Colégio de Latão, uma guilda de artífices que compartilham suas plantas livremente.', 'O Motor Analítico');
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000001', 'dnd5e:srd-5.1:spell:mending', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000001', 'dnd5e:srd-5.1:spell:light', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000001', 'dnd5e:srd-5.1:spell:message', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000001', 'dnd5e:srd-5.1:spell:detect-magic', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000001', 'dnd5e:srd-5.1:spell:identify', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000001', 'dnd5e:srd-5.1:spell:feather-fall', true);
UPDATE public.containers SET coins = '{"cp":0,"sp":12,"ep":0,"gp":40,"pp":0}'::jsonb WHERE character_id = 'e0000000-0000-4000-8000-000000000001' AND kind = 'coin_pouch';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:dagger', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000001' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:studded-leather-armor', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000001' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:tinker-s-tools', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000001' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:thieves-tools', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000001' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:magnifying-glass', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000001' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:book', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000001' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:ink-pen', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000001' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:parchment-one-sheet', 5 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000001' AND kind = 'backpack';
INSERT INTO public.party_characters (party_id, character_id) VALUES ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'e0000000-0000-4000-8000-000000000001');

-- Katherine Johnson
INSERT INTO public.characters (id, owner_id, name, system, kind, level, hp_current, hp_max, avatar_url, theme_color, attributes, system_data)
VALUES (
  'e0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000003', 'Katherine Johnson', 'dnd_5e', 'pc', 5, 27, 27,
  '/demo/pioneers/celestial-navigator.webp', '#4f8ef7',
  '{"STR":8,"DEX":14,"CON":13,"INT":18,"WIS":14,"CHA":12}'::jsonb,
  '{"race":"Humana","class":"Maga","subclass":"Escola de Adivinhação","background":"Sábia","alignment":"LG","xp":6500,"hpTemp":0,"ac":12,"speed":30,"initiative":2,"hitDice":{"total":"5d6","current":5},"deathSaves":{"successes":0,"failures":0},"skills":{"ARCANA":{"isProficient":true},"INSIGHT":{"isProficient":true},"INVESTIGATION":{"isProficient":true},"HISTORY":{"isProficient":true}},"savingThrowProficiencies":{"STR":false,"DEX":false,"CON":false,"INT":true,"WIS":true,"CHA":false},"passivePerception":12,"spellcastingSystem":"slots","spellcastingAbility":"INT","spellSaveDc":15,"spellAttackBonus":7,"spellSlots":{"1":{"max":4,"used":0},"2":{"max":3,"used":0},"3":{"max":2,"used":0}}}'::jsonb
);
INSERT INTO public.character_lore (character_id, age, height, weight, eyes, skin, hair, personality_traits, ideals, bonds, flaws, backstory, allies_and_enemies, organizations, treasure)
VALUES ('e0000000-0000-4000-8000-000000000002', '67 anos', '1,68 m', '60 kg', 'Castanhos e calorosos', 'Marrom-escura', 'Cachos brancos e curtos', 'Determinada, precisa, compassiva', 'Precisão: um número bem conferido pode trazer todos de volta para casa.', 'Os viajantes que confiaram suas vidas aos mapas dela.', 'Confere tudo duas vezes, mesmo quando não há tempo.', 'Katherine dedicou a vida a entender o movimento dos céus. De seu observatório acima das nuvens, ela traça rotas celestes que nem os maiores exploradores ousam seguir. Quando as estrelas se calam, ela confia nos próprios cálculos para guiar viajantes perdidos de volta para casa.', 'Aliada: Maren, que percorre as rotas traçadas por Katherine. Inimigos: os Cartógrafos do Véu, que vendem mapas falsos a navios à deriva.', 'O Observatório Celeste, guardião das cartas estelares do reino.', 'Astrolábio Celestial');
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:light', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:mage-hand', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:ray-of-frost', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:detect-magic', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:magic-missile', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:shield', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:misty-step', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:levitate', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:clairvoyance', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:fly', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:prestidigitation', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:acid-splash', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:chill-touch', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:mage-armor', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:burning-hands', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:blur', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:blindness-deafness', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:fireball', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:blink', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:shocking-grasp', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:poison-spray', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:vicious-mockery', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:thunderwave', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:guiding-bolt', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000002', 'dnd5e:srd-5.1:spell:shatter', true);
UPDATE public.containers SET coins = '{"cp":0,"sp":5,"ep":0,"gp":65,"pp":0}'::jsonb WHERE character_id = 'e0000000-0000-4000-8000-000000000002' AND kind = 'coin_pouch';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:quarterstaff', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000002' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:spellbook', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000002' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:component-pouch', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000002' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:navigator-s-tools', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000002' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:spyglass', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000002' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:ink-pen', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000002' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:parchment-one-sheet', 8 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000002' AND kind = 'backpack';
INSERT INTO public.party_characters (party_id, character_id) VALUES ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'e0000000-0000-4000-8000-000000000002');

-- Grace Hopper
INSERT INTO public.characters (id, owner_id, name, system, kind, level, hp_current, hp_max, avatar_url, theme_color, attributes, system_data)
VALUES (
  'e0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000002', 'Grace Hopper', 'dnd_5e', 'pc', 4, 36, 36,
  '/demo/pioneers/code-admiral.webp', '#0f8a85',
  '{"STR":16,"DEX":12,"CON":15,"INT":13,"WIS":12,"CHA":14}'::jsonb,
  '{"race":"Humana","class":"Guerreira","subclass":"Mestre de Batalha","background":"Marinheira","alignment":"LG","xp":2700,"hpTemp":0,"ac":18,"speed":30,"initiative":1,"hitDice":{"total":"4d10","current":4},"deathSaves":{"successes":0,"failures":0},"skills":{"ATHLETICS":{"isProficient":true},"PERSUASION":{"isProficient":true},"HISTORY":{"isProficient":true},"INSIGHT":{"isProficient":true}},"savingThrowProficiencies":{"STR":true,"DEX":false,"CON":true,"INT":false,"WIS":false,"CHA":false},"passivePerception":11}'::jsonb
);
INSERT INTO public.character_lore (character_id, age, height, weight, eyes, skin, hair, personality_traits, ideals, bonds, flaws, backstory, allies_and_enemies, organizations, treasure)
VALUES ('e0000000-0000-4000-8000-000000000003', '58 anos', '1,73 m', '70 kg', 'Cinza-aço', 'Bronzeada pelo mar, com uma cicatriz na bochecha', 'Ondas prateadas e pretas, raspadas de um lado', 'Pragmática, espirituosa, corajosa', 'Clareza: um plano que ninguém entende não é um plano.', 'Sua frota, cada marinheiro dela.', 'Não resiste a perguntar "por que fazemos assim?" na pior hora.', 'A almirante Grace comanda com disciplina, humor e a crença inabalável de que todo problema tem solução. Veterana de incontáveis expedições navais, ela estuda formações de batalha antigas e transforma estratégias complicadas em ordens que toda a sua frota entende. Sua maior arma não é a espada, e sim a capacidade de transformar confusão em ação.', 'Aliada: Hedy, cujas canções cifradas levam ordens entre os navios dela. Rival: Ching Shih, que ataca seus comboios e conquistou seu respeito.', 'A Frota Azul, que ela comanda como almirante.', 'A Lâmina do Almirante');
UPDATE public.containers SET coins = '{"cp":5,"sp":20,"ep":0,"gp":30,"pp":0}'::jsonb WHERE character_id = 'e0000000-0000-4000-8000-000000000003' AND kind = 'coin_pouch';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:longsword', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000003' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:shield', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000003' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:chain-mail', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000003' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:light-crossbow', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000003' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:crossbow-bolts-20', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000003' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:explorer-s-pack', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000003' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:signal-whistle', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000003' AND kind = 'backpack';
INSERT INTO public.party_characters (party_id, character_id) VALUES ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'e0000000-0000-4000-8000-000000000003');

-- Hedy Lamarr
INSERT INTO public.characters (id, owner_id, name, system, kind, level, hp_current, hp_max, avatar_url, theme_color, attributes, system_data)
VALUES (
  'e0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000002', 'Hedy Lamarr', 'dnd_5e', 'pc', 4, 27, 27,
  '/demo/pioneers/whispering-frequency.webp', '#c0183f',
  '{"STR":8,"DEX":14,"CON":12,"INT":14,"WIS":10,"CHA":17}'::jsonb,
  '{"race":"Meio-elfa","class":"Barda","subclass":"Colégio do Conhecimento","background":"Artista","alignment":"CG","xp":2700,"hpTemp":0,"ac":13,"speed":30,"initiative":2,"hitDice":{"total":"4d8","current":4},"deathSaves":{"successes":0,"failures":0},"skills":{"PERFORMANCE":{"isProficient":true},"DECEPTION":{"isProficient":true},"INVESTIGATION":{"isProficient":true},"PERSUASION":{"isProficient":true},"STEALTH":{"isProficient":true}},"savingThrowProficiencies":{"STR":false,"DEX":true,"CON":false,"INT":false,"WIS":false,"CHA":true},"passivePerception":10,"spellcastingSystem":"slots","spellcastingAbility":"CHA","spellSaveDc":13,"spellAttackBonus":5,"spellSlots":{"1":{"max":4,"used":0},"2":{"max":3,"used":0}}}'::jsonb
);
INSERT INTO public.character_lore (character_id, age, height, weight, eyes, skin, hair, personality_traits, ideals, bonds, flaws, backstory, allies_and_enemies, organizations, treasure)
VALUES ('e0000000-0000-4000-8000-000000000004', '41 anos', '1,70 m', '58 kg', 'Verdes', 'Clara, com os braços tatuados', 'Curto, em violeta e magenta', 'Engenhosa, carismática, independente', 'Liberdade: ninguém deveria ouvir uma canção que não escolheu.', 'Os aliados que se escondem dentro de suas melodias.', 'Veste um sorriso deslumbrante sobre segredos que não divide.', 'Por trás das apresentações cativantes de Hedy existe uma inventora brilhante. Ela dominou a arte de enviar mensagens secretas por melodias que mudam, permitindo que aliados se comuniquem sem ser descobertos. Seu instrumento encantado transforma uma canção sussurrada em mensagem levada por um reino inteiro.', 'Aliada: Grace, que confia a frota às canções dela. Inimigo: o inquisidor Vael, que caça toda mensagem que não consegue ler.', 'O Coro Silencioso, uma rede secreta de músicos viajantes.', 'A Lira Ressonante');
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000004', 'dnd5e:srd-5.1:spell:vicious-mockery', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000004', 'dnd5e:srd-5.1:spell:minor-illusion', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000004', 'dnd5e:srd-5.1:spell:healing-word', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000004', 'dnd5e:srd-5.1:spell:thunderwave', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000004', 'dnd5e:srd-5.1:spell:disguise-self', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000004', 'dnd5e:srd-5.1:spell:charm-person', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000004', 'dnd5e:srd-5.1:spell:hold-person', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000004', 'dnd5e:srd-5.1:spell:invisibility', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000004', 'dnd5e:srd-5.1:spell:shatter', true);
UPDATE public.containers SET coins = '{"cp":0,"sp":8,"ep":0,"gp":55,"pp":0}'::jsonb WHERE character_id = 'e0000000-0000-4000-8000-000000000004' AND kind = 'coin_pouch';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:rapier', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000004' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:dagger', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000004' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:leather-armor', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000004' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:lyre', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000004' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:disguise-kit', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000004' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:entertainer-s-pack', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000004' AND kind = 'backpack';
INSERT INTO public.party_characters (party_id, character_id) VALUES ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'e0000000-0000-4000-8000-000000000004');

-- Maren Hamilton
INSERT INTO public.characters (id, owner_id, name, system, kind, level, hp_current, hp_max, avatar_url, theme_color, attributes, system_data)
VALUES (
  'e0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000003', 'Maren Hamilton', 'dnd_5e', 'pc', 4, 36, 36,
  '/demo/pioneers/horizon-pathfinder.webp', '#d98a06',
  '{"STR":11,"DEX":16,"CON":14,"INT":13,"WIS":15,"CHA":8}'::jsonb,
  '{"race":"Humana","class":"Patrulheira","subclass":"Caçadora das Sombras","background":"Forasteira","alignment":"LN","xp":2700,"hpTemp":0,"ac":15,"speed":30,"initiative":3,"hitDice":{"total":"4d10","current":4},"deathSaves":{"successes":0,"failures":0},"skills":{"SURVIVAL":{"isProficient":true},"PERCEPTION":{"isProficient":true},"NATURE":{"isProficient":true},"STEALTH":{"isProficient":true}},"savingThrowProficiencies":{"STR":true,"DEX":true,"CON":false,"INT":false,"WIS":false,"CHA":false},"passivePerception":14,"spellcastingSystem":"slots","spellcastingAbility":"WIS","spellSaveDc":12,"spellAttackBonus":4,"spellSlots":{"1":{"max":3,"used":0}}}'::jsonb
);
INSERT INTO public.character_lore (character_id, age, height, weight, eyes, skin, hair, personality_traits, ideals, bonds, flaws, backstory, allies_and_enemies, organizations, treasure)
VALUES ('e0000000-0000-4000-8000-000000000005', '36 anos', '1,75 m', '68 kg', 'Âmbar', 'Bronze, marcada pelo sol', 'Dreads longos e escuros, com anéis dourados', 'Estratégica, disciplinada, resiliente', 'Preparo: o pior dia é superável se alguém planejou para ele.', 'Cada expedição que ela enviou, e cada uma que voltou.', 'Espera o desastre, então demora a comemorar.', 'Maren é a guardiã das jornadas além do mundo conhecido. Ela mapeia passagens perigosas entre reinos distantes e se prepara para desastres muito antes de acontecerem. Seu planejamento minucioso salvou incontáveis expedições e provou que os maiores exploradores são os que sabem trazer todos de volta.', 'Aliada: Mirela, cujas raízes a avisam de passagens ruins. Inimiga: a Maré Oca, uma fome entre os reinos que engole expedições.', 'O Pacto dos Andarilhos, exploradores que juraram trazer todos de volta.', 'A Bússola do Horizonte');
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000005', 'dnd5e:srd-5.1:spell:hunters-mark', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000005', 'dnd5e:srd-5.1:spell:cure-wounds', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000005', 'dnd5e:srd-5.1:spell:goodberry', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000005', 'dnd5e:srd-5.1:spell:alarm', true);
UPDATE public.containers SET coins = '{"cp":8,"sp":14,"ep":0,"gp":25,"pp":0}'::jsonb WHERE character_id = 'e0000000-0000-4000-8000-000000000005' AND kind = 'coin_pouch';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:longbow', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000005' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:arrows-20', 2 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000005' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:shortsword', 2 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000005' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:studded-leather-armor', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000005' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:explorer-s-pack', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000005' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:hempen-rope-50-feet', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000005' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:climber-s-kit', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000005' AND kind = 'backpack';
INSERT INTO public.party_characters (party_id, character_id) VALUES ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'e0000000-0000-4000-8000-000000000005');

-- Joan of Arc
INSERT INTO public.characters (id, owner_id, name, system, kind, level, hp_current, hp_max, avatar_url, theme_color, attributes, system_data)
VALUES (
  'e0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000001', 'Joan of Arc', 'dnd_5e', 'npc', 4, 36, 36,
  '/demo/pioneers/golden-oath.webp', '#d4a017',
  '{"STR":16,"DEX":10,"CON":14,"INT":9,"WIS":12,"CHA":16}'::jsonb,
  '{"race":"Humana","class":"Paladina","subclass":"Juramento de Devoção","background":"Acólita","alignment":"LG","xp":2700,"hpTemp":0,"ac":18,"speed":30,"initiative":0,"hitDice":{"total":"4d10","current":4},"deathSaves":{"successes":0,"failures":0},"skills":{"ATHLETICS":{"isProficient":true},"RELIGION":{"isProficient":true},"PERSUASION":{"isProficient":true},"INSIGHT":{"isProficient":true}},"savingThrowProficiencies":{"STR":false,"DEX":false,"CON":false,"INT":false,"WIS":true,"CHA":true},"passivePerception":11,"spellcastingSystem":"slots","spellcastingAbility":"CHA","spellSaveDc":13,"spellAttackBonus":5,"spellSlots":{"1":{"max":3,"used":0}}}'::jsonb
);
INSERT INTO public.character_lore (character_id, age, height, weight, eyes, skin, hair, personality_traits, ideals, bonds, flaws, backstory, allies_and_enemies, organizations, treasure)
VALUES ('e0000000-0000-4000-8000-000000000006', '24 anos', '1,68 m', '65 kg', 'Azul-acinzentados', 'Clara, com uma cicatriz na bochecha', 'Bem curto, loiro-dourado', 'Idealista, destemida, leal', 'Fé: um juramento é uma luz que se carrega pelos outros.', 'As pessoas que seguiram seu estandarte sem que ela pedisse.', 'Confia mais no chamado do que no conselho, mesmo quando o conselho tem razão.', 'Joan já foi uma jovem comum que atendeu a um chamado que mais ninguém ouvia. Guiada por um propósito inabalável, ela empunhou uma espada para defender seu povo contra probabilidades esmagadoras. Sua coragem inspira até os soldados mais assustados a se manterem unidos quando a esperança parece perdida.', 'Aliada: Florence, que cuida dos feridos sob o estandarte dela. Inimigo: o lorde Marrowen, cujo exército queimou a aldeia dela.', 'A Ordem do Estandarte da Aurora, soldados unidos por um único juramento.', 'O Estandarte da Aurora');
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000006', 'dnd5e:srd-5.1:spell:bless', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000006', 'dnd5e:srd-5.1:spell:cure-wounds', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000006', 'dnd5e:srd-5.1:spell:divine-favor', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000006', 'dnd5e:srd-5.1:spell:shield-of-faith', true);
UPDATE public.containers SET coins = '{"cp":0,"sp":3,"ep":0,"gp":15,"pp":0}'::jsonb WHERE character_id = 'e0000000-0000-4000-8000-000000000006' AND kind = 'coin_pouch';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:longsword', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000006' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:shield', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000006' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:chain-mail', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000006' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:javelin', 5 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000006' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:holy-water-flask', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000006' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:emblem', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000006' AND kind = 'backpack';

-- Mirela Pardan
INSERT INTO public.characters (id, owner_id, name, system, kind, level, hp_current, hp_max, avatar_url, theme_color, attributes, system_data)
VALUES (
  'e0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000002', 'Mirela Pardan', 'dnd_5e', 'pc', 4, 27, 27,
  '/demo/pioneers/rootweaver.webp', '#2f9e55',
  '{"STR":8,"DEX":14,"CON":13,"INT":14,"WIS":17,"CHA":10}'::jsonb,
  '{"race":"Elfa da Floresta","class":"Druida","subclass":"Círculo da Terra","background":"Eremita","alignment":"NG","xp":2700,"hpTemp":0,"ac":14,"speed":35,"initiative":2,"hitDice":{"total":"4d8","current":4},"deathSaves":{"successes":0,"failures":0},"skills":{"NATURE":{"isProficient":true},"PERCEPTION":{"isProficient":true},"INVESTIGATION":{"isProficient":true},"MEDICINE":{"isProficient":true}},"savingThrowProficiencies":{"STR":false,"DEX":false,"CON":false,"INT":true,"WIS":true,"CHA":false},"passivePerception":15,"spellcastingSystem":"slots","spellcastingAbility":"WIS","spellSaveDc":13,"spellAttackBonus":5,"spellSlots":{"1":{"max":4,"used":0},"2":{"max":3,"used":0}}}'::jsonb
);
INSERT INTO public.character_lore (character_id, age, height, weight, eyes, skin, hair, personality_traits, ideals, bonds, flaws, backstory, allies_and_enemies, organizations, treasure)
VALUES ('e0000000-0000-4000-8000-000000000007', '410 anos', '1,60 m', '50 kg', 'Castanho-escuros', 'Marrom e curtida, com runas claras', 'Dreads brancos, trançados com flores e folhas', 'Paciente, inventiva, observadora', 'Equilíbrio: toda ligação importa, e nenhuma pode prender as outras.', 'A floresta ancestral e os bosques que as raízes dela alcançam.', 'Prefere passar uma semana desembaraçando um problema a cortá-lo.', 'No coração da floresta ancestral, a Tecelã de Raízes cuida de uma vasta rede de raízes vivas que liga bosques distantes. Ela aprendeu a guiar o crescimento delas para que mensagens e energia vital viajem sem ficar presas em ciclos infinitos. Para ela, harmonia não é silêncio, e sim a arte de manter em equilíbrio cada ligação viva.', 'Aliada: Maren, que traz notícias de além da floresta. Inimiga: a Companhia Cinzenta, madeireiros que derrubam os bosques antigos por lucro.', 'O Círculo do Bosque Profundo, druidas que cuidam da rede viva.', 'Cajado da Rede Viva');
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000007', 'dnd5e:srd-5.1:spell:druidcraft', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000007', 'dnd5e:srd-5.1:spell:produce-flame', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000007', 'dnd5e:srd-5.1:spell:shillelagh', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000007', 'dnd5e:srd-5.1:spell:entangle', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000007', 'dnd5e:srd-5.1:spell:goodberry', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000007', 'dnd5e:srd-5.1:spell:healing-word', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000007', 'dnd5e:srd-5.1:spell:speak-with-animals', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000007', 'dnd5e:srd-5.1:spell:barkskin', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000007', 'dnd5e:srd-5.1:spell:moonbeam', true);
UPDATE public.containers SET coins = '{"cp":0,"sp":9,"ep":0,"gp":20,"pp":0}'::jsonb WHERE character_id = 'e0000000-0000-4000-8000-000000000007' AND kind = 'coin_pouch';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:wooden-staff', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000007' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:scimitar', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000007' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:leather-armor', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000007' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:herbalism-kit', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000007' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:sprig-of-mistletoe', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000007' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:explorer-s-pack', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000007' AND kind = 'backpack';
INSERT INTO public.party_characters (party_id, character_id) VALUES ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'e0000000-0000-4000-8000-000000000007');

-- Ching Shih
INSERT INTO public.characters (id, owner_id, name, system, kind, level, hp_current, hp_max, avatar_url, theme_color, attributes, system_data)
VALUES (
  'e0000000-0000-4000-8000-000000000008', 'c0000000-0000-4000-8000-000000000001', 'Ching Shih', 'dnd_5e', 'npc', 4, 27, 27,
  '/demo/pioneers/steel-tide.webp', '#4a78b0',
  '{"STR":10,"DEX":17,"CON":13,"INT":14,"WIS":12,"CHA":14}'::jsonb,
  '{"race":"Humana","class":"Ladina","subclass":"Mestre do Crime","background":"Criminosa","alignment":"LE","xp":2700,"hpTemp":0,"ac":14,"speed":30,"initiative":3,"hitDice":{"total":"4d8","current":4},"deathSaves":{"successes":0,"failures":0},"skills":{"DECEPTION":{"isProficient":true},"INSIGHT":{"isProficient":true},"INTIMIDATION":{"isProficient":true},"PERSUASION":{"isProficient":true},"STEALTH":{"isProficient":true}},"savingThrowProficiencies":{"STR":false,"DEX":true,"CON":false,"INT":true,"WIS":false,"CHA":false},"passivePerception":11}'::jsonb
);
INSERT INTO public.character_lore (character_id, age, height, weight, eyes, skin, hair, personality_traits, ideals, bonds, flaws, backstory, allies_and_enemies, organizations, treasure)
VALUES ('e0000000-0000-4000-8000-000000000008', '38 anos', '1,60 m', '54 kg', 'Quase pretos', 'Oliva-clara', 'Chanel preto e liso, com franja', 'Calculista, autoritária, astuta', 'Ordem: um código só, respeitado por todos, vence cem capitães.', 'Os capitães que juraram seguir o código dela.', 'Não perdoa nada que quebre o código.', 'Ching Shih governa as águas costeiras com inteligência, disciplina e uma rede de capitães leais. Antes subestimada por poderosos comandantes navais, ela uniu tripulações rivais sob um único código. Os inimigos temem mais a astúcia dela do que suas lâminas, pois ela sempre parece saber os planos deles antes de zarparem.', 'Aliados: os capitães que juraram seguir o código dela. Rival: Grace, a única almirante que ela ainda não superou.', 'A Confederação da Maré de Aço, tripulações rivais unidas sob um único código.', 'O Corta-Maré');
UPDATE public.containers SET coins = '{"cp":0,"sp":30,"ep":0,"gp":180,"pp":0}'::jsonb WHERE character_id = 'e0000000-0000-4000-8000-000000000008' AND kind = 'coin_pouch';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:shortsword', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000008' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:dagger', 2 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000008' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:leather-armor', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000008' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:thieves-tools', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000008' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:hooded-lantern', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000008' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:grappling-hook', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000008' AND kind = 'backpack';

-- Queen Nzinga
INSERT INTO public.characters (id, owner_id, name, system, kind, level, hp_current, hp_max, avatar_url, theme_color, attributes, system_data)
VALUES (
  'e0000000-0000-4000-8000-000000000009', 'c0000000-0000-4000-8000-000000000001', 'Queen Nzinga', 'dnd_5e', 'npc', 4, 31, 31,
  '/demo/pioneers/copper-sovereign.webp', '#b87333',
  '{"STR":12,"DEX":17,"CON":14,"INT":10,"WIS":15,"CHA":13}'::jsonb,
  '{"race":"Humana","class":"Monja","subclass":"Caminho da Mão Aberta","background":"Nobre","alignment":"LN","xp":2700,"hpTemp":0,"ac":16,"speed":40,"initiative":3,"hitDice":{"total":"4d8","current":4},"deathSaves":{"successes":0,"failures":0},"skills":{"ACROBATICS":{"isProficient":true},"HISTORY":{"isProficient":true},"INSIGHT":{"isProficient":true},"PERSUASION":{"isProficient":true}},"savingThrowProficiencies":{"STR":true,"DEX":true,"CON":false,"INT":false,"WIS":false,"CHA":false},"passivePerception":12}'::jsonb
);
INSERT INTO public.character_lore (character_id, age, height, weight, eyes, skin, hair, personality_traits, ideals, bonds, flaws, backstory, allies_and_enemies, organizations, treasure)
VALUES ('e0000000-0000-4000-8000-000000000009', '44 anos', '1,78 m', '75 kg', 'Castanho-escuros', 'Marrom-acobreada', 'Tranças pretas, coroadas de cobre', 'Diplomática, determinada, estrategista', 'Soberania: a terra natal se defende primeiro com paciência, depois com aço.', 'Os guardiões que treinou e que agora protegem o povo dela.', 'Esconde tão bem o próximo passo que os aliados não conseguem acompanhar.', 'A rainha Nzinga é mestra em disciplina, diplomacia e resistência. Dentro de seu santuário fortificado, ela treina guardiões para defender a terra natal com paciência, agilidade e determinação inabalável. Ela sabe que a vitória nem sempre vem pela força; às vezes o golpe mais poderoso é aquele que o inimigo nunca vê chegar.', 'Aliada: Boudica, com quem mantém um pacto cauteloso. Inimigo: o vice-rei Dorvane, que confunde a paciência dela com fraqueza.', 'O Santuário de Cobre, uma escola fortificada de guardiões.', 'O Cajado da Soberana');
UPDATE public.containers SET coins = '{"cp":0,"sp":10,"ep":0,"gp":35,"pp":0}'::jsonb WHERE character_id = 'e0000000-0000-4000-8000-000000000009' AND kind = 'coin_pouch';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:quarterstaff', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000009' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:dart', 10 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000009' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:traveler-s-clothes', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000009' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:rations-1-day', 5 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000009' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:waterskin', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000009' AND kind = 'backpack';

-- Hypatia
INSERT INTO public.characters (id, owner_id, name, system, kind, level, hp_current, hp_max, avatar_url, theme_color, attributes, system_data)
VALUES (
  'e0000000-0000-4000-8000-000000000010', 'c0000000-0000-4000-8000-000000000001', 'Hypatia', 'dnd_5e', 'npc', 5, 32, 32,
  '/demo/pioneers/lunar-scholar.webp', '#b79cf2',
  '{"STR":8,"DEX":14,"CON":14,"INT":16,"WIS":12,"CHA":17}'::jsonb,
  '{"race":"Humana","class":"Feiticeira","subclass":"Linhagem Dracônica","background":"Sábia","alignment":"NG","xp":6500,"hpTemp":0,"ac":13,"speed":30,"initiative":2,"hitDice":{"total":"5d6","current":5},"deathSaves":{"successes":0,"failures":0},"skills":{"ARCANA":{"isProficient":true},"HISTORY":{"isProficient":true},"INSIGHT":{"isProficient":true},"PERSUASION":{"isProficient":true}},"savingThrowProficiencies":{"STR":false,"DEX":false,"CON":true,"INT":false,"WIS":false,"CHA":true},"passivePerception":11,"spellcastingSystem":"slots","spellcastingAbility":"CHA","spellSaveDc":14,"spellAttackBonus":6,"spellSlots":{"1":{"max":4,"used":0},"2":{"max":3,"used":0},"3":{"max":2,"used":0}}}'::jsonb
);
INSERT INTO public.character_lore (character_id, age, height, weight, eyes, skin, hair, personality_traits, ideals, bonds, flaws, backstory, allies_and_enemies, organizations, treasure)
VALUES ('e0000000-0000-4000-8000-000000000010', '34 anos', '1,70 m', '62 kg', 'Cinza-claros', 'Oliva', 'Ondas pretas e longas', 'Racional, independente, contemplativa', 'Razão: toda afirmação merece uma pergunta.', 'A biblioteca e os pergaminhos que ninguém mais salvaria.', 'Responde à raiva com um argumento, e isso raramente acalma alguém.', 'Hypatia nasceu com uma sensibilidade incomum aos ritmos do cosmos. Depois de anos de estudo, aprendeu a canalizar esse dom natural em magia celeste. Dentro da grande biblioteca, ela protege saberes esquecidos e ensina que a sabedoria cresce com curiosidade, razão e a coragem de questionar.', 'Aliada: Katherine, com quem troca tabelas estelares. Inimigos: os Zelotes da Brasa, que prefeririam queimar a biblioteca a lê-la.', 'Os Guardiões da Grande Biblioteca, estudiosos de saberes esquecidos.', 'A Esfera Lunar');
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000010', 'dnd5e:srd-5.1:spell:light', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000010', 'dnd5e:srd-5.1:spell:ray-of-frost', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000010', 'dnd5e:srd-5.1:spell:minor-illusion', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000010', 'dnd5e:srd-5.1:spell:prestidigitation', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000010', 'dnd5e:srd-5.1:spell:shield', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000010', 'dnd5e:srd-5.1:spell:sleep', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000010', 'dnd5e:srd-5.1:spell:magic-missile', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000010', 'dnd5e:srd-5.1:spell:mirror-image', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000010', 'dnd5e:srd-5.1:spell:misty-step', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000010', 'dnd5e:srd-5.1:spell:hold-person', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000010', 'dnd5e:srd-5.1:spell:fly', true);
UPDATE public.containers SET coins = '{"cp":0,"sp":0,"ep":0,"gp":90,"pp":0}'::jsonb WHERE character_id = 'e0000000-0000-4000-8000-000000000010' AND kind = 'coin_pouch';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:dagger', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000010' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:component-pouch', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000010' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:crystal', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000010' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:scholar-s-pack', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000010' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:book', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000010' AND kind = 'backpack';

-- Florence Nightingale
INSERT INTO public.characters (id, owner_id, name, system, kind, level, hp_current, hp_max, avatar_url, theme_color, attributes, system_data)
VALUES (
  'e0000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000001', 'Florence Nightingale', 'dnd_5e', 'npc', 4, 31, 31,
  '/demo/pioneers/keeper-of-light.webp', '#e6d9a8',
  '{"STR":10,"DEX":12,"CON":14,"INT":13,"WIS":17,"CHA":14}'::jsonb,
  '{"race":"Humana","class":"Clériga","subclass":"Domínio da Vida","background":"Acólita","alignment":"LG","xp":2700,"hpTemp":0,"ac":17,"speed":30,"initiative":1,"hitDice":{"total":"4d8","current":4},"deathSaves":{"successes":0,"failures":0},"skills":{"MEDICINE":{"isProficient":true},"INSIGHT":{"isProficient":true},"RELIGION":{"isProficient":true},"PERSUASION":{"isProficient":true}},"savingThrowProficiencies":{"STR":false,"DEX":false,"CON":false,"INT":false,"WIS":true,"CHA":true},"passivePerception":13,"spellcastingSystem":"slots","spellcastingAbility":"WIS","spellSaveDc":13,"spellAttackBonus":5,"spellSlots":{"1":{"max":4,"used":0},"2":{"max":3,"used":0}}}'::jsonb
);
INSERT INTO public.character_lore (character_id, age, height, weight, eyes, skin, hair, personality_traits, ideals, bonds, flaws, backstory, allies_and_enemies, organizations, treasure)
VALUES ('e0000000-0000-4000-8000-000000000011', '33 anos', '1,63 m', '59 kg', 'Castanho-mel', 'Marrom-clara', 'Cachos escuros e curtos, com folhas de louro douradas', 'Empática, rigorosa, persistente', 'Cuidado: bondade sem conhecimento não basta, e o contrário também não.', 'Cada paciente que dormiu sob a luz da lanterna dela.', 'Vai além do cansaço e espera o mesmo dos outros.', 'Quando guerra e doença devastaram os reinos vizinhos, Florence transformou um santuário abandonado em refúgio para os feridos. Carregando a lanterna pelas noites mais escuras, ela une magia de cura, observação atenta e cuidado compassivo. Seu trabalho ensinou gerações de que salvar vidas exige conhecimento e bondade.', 'Aliada: Joan, que envia os feridos ao santuário. Inimigos: a Febre Cinzenta e todo lorde que se recusa a pagar por água limpa.', 'A Irmandade da Lanterna, curandeiras que fazem vigília durante a noite.', 'A Lanterna Perene');
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000011', 'dnd5e:srd-5.1:spell:guidance', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000011', 'dnd5e:srd-5.1:spell:sacred-flame', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000011', 'dnd5e:srd-5.1:spell:spare-the-dying', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000011', 'dnd5e:srd-5.1:spell:cure-wounds', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000011', 'dnd5e:srd-5.1:spell:healing-word', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000011', 'dnd5e:srd-5.1:spell:bless', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000011', 'dnd5e:srd-5.1:spell:guiding-bolt', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000011', 'dnd5e:srd-5.1:spell:lesser-restoration', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000011', 'dnd5e:srd-5.1:spell:spiritual-weapon', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000011', 'dnd5e:srd-5.1:spell:prayer-of-healing', true);
UPDATE public.containers SET coins = '{"cp":0,"sp":6,"ep":0,"gp":22,"pp":0}'::jsonb WHERE character_id = 'e0000000-0000-4000-8000-000000000011' AND kind = 'coin_pouch';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:mace', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000011' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:shield', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000011' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:scale-mail', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000011' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:healer-s-kit', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000011' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:holy-water-flask', 2 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000011' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:emblem', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000011' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:hooded-lantern', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000011' AND kind = 'backpack';

-- Boudica
INSERT INTO public.characters (id, owner_id, name, system, kind, level, hp_current, hp_max, avatar_url, theme_color, attributes, system_data)
VALUES (
  'e0000000-0000-4000-8000-000000000012', 'c0000000-0000-4000-8000-000000000001', 'Boudica', 'dnd_5e', 'npc', 4, 45, 45,
  '/demo/pioneers/ember-queen.webp', '#c4593a',
  '{"STR":17,"DEX":14,"CON":16,"INT":8,"WIS":12,"CHA":12}'::jsonb,
  '{"race":"Humana","class":"Bárbara","subclass":"Caminho do Furioso","background":"Herói do Povo","alignment":"CN","xp":2700,"hpTemp":0,"ac":15,"speed":30,"initiative":2,"hitDice":{"total":"4d12","current":4},"deathSaves":{"successes":0,"failures":0},"skills":{"ATHLETICS":{"isProficient":true},"INTIMIDATION":{"isProficient":true},"SURVIVAL":{"isProficient":true},"PERCEPTION":{"isProficient":true}},"savingThrowProficiencies":{"STR":true,"DEX":false,"CON":true,"INT":false,"WIS":false,"CHA":false},"passivePerception":13}'::jsonb
);
INSERT INTO public.character_lore (character_id, age, height, weight, eyes, skin, hair, personality_traits, ideals, bonds, flaws, backstory, allies_and_enemies, organizations, treasure)
VALUES ('e0000000-0000-4000-8000-000000000012', '39 anos', '1,80 m', '82 kg', 'Azuis', 'Clara, com pintura de guerra azul', 'Longas ondas ruivas e uma trança grossa', 'Feroz, orgulhosa, protetora', 'Desafio: um povo unido não pode ser esmagado.', 'As tribos dispersas que ela uniu em uma só.', 'A raiva dela chega antes do julgamento.', 'Boudica se ergueu contra um império que tentava esmagar seu povo. Com fogo no coração e feroz determinação de defender a terra natal, ela uniu tribos dispersas numa rebelião formidável. No campo de batalha, sua presença é como uma tempestade: selvagem, implacável e impossível de ignorar.', 'Aliada: Nzinga, que lhe ensinou que uma retirada pode ser uma arma. Inimigo: o Domínio de Ferro, o império que tentou esmagar o povo dela.', 'O Conselho das Tribos Livres, que não responde a coroa nenhuma.', 'A Lança da Rebelde');
UPDATE public.containers SET coins = '{"cp":0,"sp":18,"ep":0,"gp":12,"pp":0}'::jsonb WHERE character_id = 'e0000000-0000-4000-8000-000000000012' AND kind = 'coin_pouch';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:greataxe', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000012' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:handaxe', 2 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000012' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:javelin', 4 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000012' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:hide-armor', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000012' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:explorer-s-pack', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000012' AND kind = 'backpack';

-- Mary Shelley
INSERT INTO public.characters (id, owner_id, name, system, kind, level, hp_current, hp_max, avatar_url, theme_color, attributes, system_data)
VALUES (
  'e0000000-0000-4000-8000-000000000013', 'c0000000-0000-4000-8000-000000000001', 'Mary Shelley', 'dnd_5e', 'npc', 3, 24, 24,
  '/demo/pioneers/spark-of-the-forbidden.webp', '#2ec4b6',
  '{"STR":8,"DEX":14,"CON":14,"INT":15,"WIS":12,"CHA":17}'::jsonb,
  '{"race":"Humana","class":"Bruxa (Warlock)","subclass":"O Patrono Morto-vivo","background":"Sábia","alignment":"CN","xp":900,"hpTemp":0,"ac":13,"speed":30,"initiative":2,"hitDice":{"total":"3d8","current":3},"deathSaves":{"successes":0,"failures":0},"skills":{"ARCANA":{"isProficient":true},"INVESTIGATION":{"isProficient":true},"HISTORY":{"isProficient":true},"DECEPTION":{"isProficient":true}},"savingThrowProficiencies":{"STR":false,"DEX":false,"CON":false,"INT":false,"WIS":true,"CHA":true},"passivePerception":11,"spellcastingSystem":"slots","spellcastingAbility":"CHA","spellSaveDc":13,"spellAttackBonus":5,"spellSlots":{"1":{"max":0,"used":0},"2":{"max":2,"used":0}}}'::jsonb
);
INSERT INTO public.character_lore (character_id, age, height, weight, eyes, skin, hair, personality_traits, ideals, bonds, flaws, backstory, allies_and_enemies, organizations, treasure)
VALUES ('e0000000-0000-4000-8000-000000000013', '26 anos', '1,66 m', '54 kg', 'Verde-acinzentados', 'Muito clara', 'Loiro-platinado e desalinhado, com tranças finas', 'Introspectiva, criativa, questionadora', 'Responsabilidade: quem cria precisa responder pelo que criou.', 'O pacto que firmou e o que ele exige dela.', 'Não consegue deixar uma pergunta proibida em paz.', 'Mary sempre se fascinou pela fronteira entre a vida e a morte. Depois de descobrir uma fonte antiga de energia espectral, firmou um pacto misterioso para desvendar seus segredos. Agora, em seu laboratório iluminado por tempestades, ela estuda as consequências da criação e pergunta se quem traz vida ao mundo está pronto para cuidar dela.', 'Aliada: Hypatia, a única estudiosa que ainda debate com ela. Inimigo: o Patrono Pálido, que um dia cobrará o pacto.', 'O Círculo da Tempestade, uma sociedade secreta que estuda ciências proibidas.', 'O Grimório Galvânico');
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000013', 'dnd5e:srd-5.1:spell:eldritch-blast', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000013', 'dnd5e:srd-5.1:spell:chill-touch', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000013', 'dnd5e:srd-5.1:spell:hellish-rebuke', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000013', 'dnd5e:srd-5.1:spell:unseen-servant', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000013', 'dnd5e:srd-5.1:spell:darkness', true);
INSERT INTO public.character_spells (character_id, spell_ref, is_prepared) VALUES ('e0000000-0000-4000-8000-000000000013', 'dnd5e:srd-5.1:spell:misty-step', true);
UPDATE public.containers SET coins = '{"cp":0,"sp":4,"ep":0,"gp":28,"pp":0}'::jsonb WHERE character_id = 'e0000000-0000-4000-8000-000000000013' AND kind = 'coin_pouch';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:light-crossbow', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000013' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:crossbow-bolts-20', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000013' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:dagger', 2 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000013' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:studded-leather-armor', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000013' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:orb', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000013' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:component-pouch', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000013' AND kind = 'backpack';
INSERT INTO public.inventory_items (container_id, item_ref, quantity)
SELECT id, 'dnd5e:srd-5.1:item:book', 1 FROM public.containers WHERE character_id = 'e0000000-0000-4000-8000-000000000013' AND kind = 'backpack';
