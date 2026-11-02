-- Inventário do personagem: os lugares onde ele guarda coisas (algibeira, mochila, baú) e as
-- entradas de itens. O catálogo de itens continua em arquivo; aqui fica só o que é do personagem,
-- como em character_spells.
--
-- 1. Tabelas
-- 2. Regras que o CHECK não alcança (triggers): algibeira fixa, limites
-- 3. Algibeira e mochila para todo personagem (novos e existentes)
-- 4. RLS: o dono lê e escreve; o mestre da mesa lê; mais ninguém vê
-- 5. duplicate_character passa a copiar o inventário

-- 1. Tabelas

CREATE TABLE public.character_containers (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid        NOT NULL REFERENCES public.characters (id) ON DELETE CASCADE,
  kind         text        NOT NULL CHECK (kind IN ('coin_pouch', 'backpack', 'chest')),
  name         text        CHECK (char_length(name) <= 60),
  position     integer     NOT NULL DEFAULT 0,
  -- As cinco moedas, todas presentes, inteiras de 0 a 1.000.000.000 (o teto que a ficha já usava)
  coins        jsonb       NOT NULL DEFAULT '{"cp":0,"sp":0,"ep":0,"gp":0,"pp":0}'::jsonb
    CONSTRAINT character_containers_coins_check CHECK (
      jsonb_typeof(coins) = 'object'
      AND coins ?& ARRAY['cp', 'sp', 'ep', 'gp', 'pp']
      AND coins - ARRAY['cp', 'sp', 'ep', 'gp', 'pp'] = '{}'::jsonb
      AND NOT jsonb_path_exists(
        coins,
        '$.* ? (@.type() != "number" || @ < 0 || @ > 1000000000 || @ != @.floor())'
      )
    ),
  created_at   timestamptz NOT NULL DEFAULT now(),
  -- Alvo da chave composta de character_items: o lugar tem que ser do mesmo personagem
  CONSTRAINT character_containers_id_character_key UNIQUE (id, character_id)
);

-- Uma algibeira por personagem
CREATE UNIQUE INDEX character_containers_one_coin_pouch
  ON public.character_containers (character_id)
  WHERE kind = 'coin_pouch';

CREATE INDEX character_containers_character_id_idx
  ON public.character_containers (character_id, position);

CREATE TABLE public.character_items (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid        NOT NULL REFERENCES public.characters (id) ON DELETE CASCADE,
  container_id uuid        NOT NULL,
  item_ref     text        NOT NULL CHECK (char_length(item_ref) <= 120),
  quantity     integer     NOT NULL CHECK (quantity BETWEEN 1 AND 9999),
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT character_items_container_item_key UNIQUE (container_id, item_ref),
  -- Chave composta em vez de trigger: o lugar existe e é do mesmo personagem da entrada,
  -- garantido pelo próprio Postgres também ao mover a entrada de lugar.
  CONSTRAINT character_items_container_fkey FOREIGN KEY (container_id, character_id)
    REFERENCES public.character_containers (id, character_id) ON DELETE CASCADE
);

CREATE INDEX character_items_character_id_idx ON public.character_items (character_id);

-- 2. Regras que o CHECK não alcança
--
-- SECURITY DEFINER nas três: elas contam e conferem linhas do personagem inteiro, e o resultado
-- não pode depender do que o RLS deixa quem chamou ver.

-- A algibeira não se apaga, a não ser junto com o personagem (a cascata roda depois de a linha
-- do personagem sumir, então ele não existe mais quando chega aqui).
CREATE FUNCTION private.keep_coin_pouch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.kind = 'coin_pouch'
       AND EXISTS (SELECT 1 FROM public.characters WHERE id = OLD.character_id) THEN
      RAISE EXCEPTION USING MESSAGE = 'coin_pouch_required', ERRCODE = 'P0001';
    END IF;
    RETURN OLD;
  END IF;

  -- UPDATE: o lugar não muda de personagem, e a algibeira não vira outro tipo (nem o contrário)
  IF NEW.character_id IS DISTINCT FROM OLD.character_id
     OR (NEW.kind = 'coin_pouch') IS DISTINCT FROM (OLD.kind = 'coin_pouch') THEN
    RAISE EXCEPTION USING MESSAGE = 'container_immutable', ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_character_containers_keep_coin_pouch
  BEFORE UPDATE OF kind, character_id OR DELETE ON public.character_containers
  FOR EACH ROW
  EXECUTE FUNCTION private.keep_coin_pouch();

-- Até 20 lugares por personagem. O lock por personagem impede que duas inserções ao mesmo tempo
-- passem do limite juntas.
CREATE FUNCTION private.limit_character_containers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('character_containers'), pg_catalog.hashtext(NEW.character_id::text)
  );
  IF (SELECT count(*) FROM public.character_containers WHERE character_id = NEW.character_id) >= 20 THEN
    RAISE EXCEPTION USING MESSAGE = 'container_limit', ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_character_containers_limit
  BEFORE INSERT ON public.character_containers
  FOR EACH ROW
  EXECUTE FUNCTION private.limit_character_containers();

-- Até 500 entradas por personagem. Somar a uma entrada que já está no lugar (upsert) não cria
-- entrada nova, então passa mesmo no limite.
CREATE FUNCTION private.limit_character_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.character_items
    WHERE container_id = NEW.container_id AND item_ref = NEW.item_ref
  ) THEN
    RETURN NEW;
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('character_items'), pg_catalog.hashtext(NEW.character_id::text)
  );
  IF (SELECT count(*) FROM public.character_items WHERE character_id = NEW.character_id) >= 500 THEN
    RAISE EXCEPTION USING MESSAGE = 'item_limit', ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_character_items_limit
  BEFORE INSERT ON public.character_items
  FOR EACH ROW
  EXECUTE FUNCTION private.limit_character_items();

-- 3. Algibeira e mochila para todo personagem

-- Os que já existem (inclusive os apagados com deleted_at, que podem voltar)
INSERT INTO public.character_containers (character_id, kind, position)
SELECT c.id, 'coin_pouch', 0
FROM public.characters AS c
WHERE NOT EXISTS (
  SELECT 1 FROM public.character_containers AS cc
  WHERE cc.character_id = c.id AND cc.kind = 'coin_pouch'
);

INSERT INTO public.character_containers (character_id, kind, position)
SELECT c.id, 'backpack', 1
FROM public.characters AS c
WHERE NOT EXISTS (
  SELECT 1 FROM public.character_containers AS cc
  WHERE cc.character_id = c.id AND cc.kind = 'backpack'
);

-- Os novos, por qualquer caminho (app, duplicar, seed)
CREATE FUNCTION private.create_default_containers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.character_containers (character_id, kind, position)
  VALUES (NEW.id, 'coin_pouch', 0), (NEW.id, 'backpack', 1);
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_characters_default_containers
  AFTER INSERT ON public.characters
  FOR EACH ROW
  EXECUTE FUNCTION private.create_default_containers();

REVOKE ALL ON FUNCTION private.keep_coin_pouch() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.limit_character_containers() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.limit_character_items() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.create_default_containers() FROM PUBLIC, anon, authenticated;

-- 4. RLS e grants (os mesmos de character_spells)

ALTER TABLE public.character_containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_can_manage_character_container" ON public.character_containers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE public.characters.id = character_id
        AND public.characters.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE public.characters.id = character_id
        AND public.characters.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "character_containers_select_party_gm" ON public.character_containers
  FOR SELECT TO authenticated
  USING (character_id IN (SELECT private.gm_readable_character_ids()));

CREATE POLICY "owner_can_manage_character_item" ON public.character_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE public.characters.id = character_id
        AND public.characters.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE public.characters.id = character_id
        AND public.characters.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "character_items_select_party_gm" ON public.character_items
  FOR SELECT TO authenticated
  USING (character_id IN (SELECT private.gm_readable_character_ids()));

REVOKE ALL ON TABLE public.character_containers, public.character_items
  FROM anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.character_containers, public.character_items
  TO authenticated, service_role;

-- 5. Duplicar copia o inventário
--
-- A cópia já nasce com algibeira e mochila (trigger acima). As moedas da algibeira vão para a
-- algibeira da cópia; a primeira mochila do original casa com a mochila da cópia; os demais lugares
-- são criados. Cada entrada vai para o lugar correspondente da cópia, nunca para o do original.
CREATE OR REPLACE FUNCTION public.duplicate_character(p_character_id uuid, p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
  v_first_backpack uuid;
  v_copy_pouch uuid;
  v_copy_backpack uuid;
  v_target uuid;
  r record;
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

  SELECT id INTO v_first_backpack
  FROM public.character_containers
  WHERE character_id = p_character_id AND kind = 'backpack'
  ORDER BY position, created_at, id
  LIMIT 1;

  SELECT id INTO v_copy_pouch
  FROM public.character_containers
  WHERE character_id = v_id AND kind = 'coin_pouch';

  SELECT id INTO v_copy_backpack
  FROM public.character_containers
  WHERE character_id = v_id AND kind = 'backpack';

  FOR r IN
    SELECT id, kind, name, position, coins
    FROM public.character_containers
    WHERE character_id = p_character_id
    ORDER BY position, created_at, id
  LOOP
    IF r.kind = 'coin_pouch' OR r.id = v_first_backpack THEN
      v_target := CASE WHEN r.kind = 'coin_pouch' THEN v_copy_pouch ELSE v_copy_backpack END;
      UPDATE public.character_containers
      SET name = r.name, position = r.position, coins = r.coins
      WHERE id = v_target;
    ELSE
      INSERT INTO public.character_containers (character_id, kind, name, position, coins)
      VALUES (v_id, r.kind, r.name, r.position, r.coins)
      RETURNING id INTO v_target;
    END IF;

    INSERT INTO public.character_items (character_id, container_id, item_ref, quantity)
    SELECT v_id, v_target, item_ref, quantity
    FROM public.character_items
    WHERE container_id = r.id;
  END LOOP;

  RETURN v_id;
END;
$$;
