-- Inventário: os lugares onde se guardam coisas (algibeira, mochila e baú de um personagem; baú da
-- party) e as entradas de itens. O catálogo de itens continua em arquivo; aqui fica só o que é dos
-- usuários, como em character_spells.
--
-- Todo lugar tem exatamente um dono: um personagem ou uma mesa. As entradas não guardam dono; ele
-- vem do lugar, então mover um item é só trocar o container_id.
--
-- 1. Tabelas
-- 2. Quem escreve num lugar (uma função só, usada pelo RLS e pelos limites)
-- 3. Regras que o CHECK não alcança (triggers): dono e tipos fixos, limites
-- 4. Algibeira e mochila para todo personagem (trigger primeiro, depois os que já existem)
-- 5. RLS e grants
-- 6. duplicate_character passa a copiar o inventário

-- 1. Tabelas

CREATE TABLE public.containers (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid        REFERENCES public.characters (id) ON DELETE CASCADE,
  party_id     uuid        REFERENCES public.parties (id) ON DELETE CASCADE,
  kind         text        NOT NULL,
  name         text        CHECK (char_length(name) <= 60),
  position     integer     NOT NULL DEFAULT 0,
  -- As cinco moedas, todas presentes, inteiras de 0 a 1.000.000.000 (o teto que a ficha já usava)
  coins        jsonb       NOT NULL DEFAULT '{"cp":0,"sp":0,"ep":0,"gp":0,"pp":0}'::jsonb
    CONSTRAINT containers_coins_check CHECK (
      jsonb_typeof(coins) = 'object'
      AND coins ?& ARRAY['cp', 'sp', 'ep', 'gp', 'pp']
      AND coins - ARRAY['cp', 'sp', 'ep', 'gp', 'pp'] = '{}'::jsonb
      AND NOT jsonb_path_exists(
        coins,
        '$.* ? (@.type() != "number" || @ < 0 || @ > 1000000000 || @ != @.floor())'
      )
    ),
  created_at   timestamptz NOT NULL DEFAULT now(),
  -- Exatamente um dono
  CONSTRAINT containers_one_owner CHECK (num_nonnulls(character_id, party_id) = 1),
  -- O tipo combina com o dono
  CONSTRAINT containers_kind_owner CHECK (
    (kind IN ('coin_pouch', 'backpack', 'chest') AND character_id IS NOT NULL)
    OR (kind = 'party_chest' AND party_id IS NOT NULL)
  )
);

-- Uma algibeira por personagem, um baú por mesa
CREATE UNIQUE INDEX containers_one_coin_pouch
  ON public.containers (character_id)
  WHERE kind = 'coin_pouch';

CREATE UNIQUE INDEX containers_one_party_chest
  ON public.containers (party_id)
  WHERE kind = 'party_chest';

-- Busca por dono (tela, RLS, limites e cascata das chaves estrangeiras)
CREATE INDEX containers_character_id_idx
  ON public.containers (character_id, position)
  WHERE character_id IS NOT NULL;

CREATE INDEX containers_party_id_idx
  ON public.containers (party_id, position)
  WHERE party_id IS NOT NULL;

CREATE TABLE public.inventory_items (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id uuid        NOT NULL REFERENCES public.containers (id) ON DELETE CASCADE,
  item_ref     text        NOT NULL CHECK (char_length(item_ref) BETWEEN 1 AND 120),
  quantity     integer     NOT NULL CHECK (quantity BETWEEN 1 AND 9999),
  created_at   timestamptz NOT NULL DEFAULT now(),
  -- Também serve de índice para container_id
  CONSTRAINT inventory_items_container_item_key UNIQUE (container_id, item_ref)
);

-- 2. Quem escreve num lugar
--
-- O dono do personagem escreve nos lugares dele; o mestre e os membros ativos da mesa escrevem no
-- baú dela (private.is_party_member só conta status 'active'; o mestre não é membro, por isso as
-- duas). O mestre que só lê a ficha não está aqui.
--
-- SECURITY DEFINER: a resposta não pode depender do que o RLS deixa quem chamou ver. Só responde
-- sobre o próprio usuário, então não revela nada de outros.
CREATE FUNCTION private.can_write_owner(p_character_id uuid, p_party_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_character_id IS NOT NULL THEN EXISTS (
      SELECT 1 FROM public.characters
      WHERE id = p_character_id AND owner_id = (SELECT auth.uid())
    )
    WHEN p_party_id IS NOT NULL THEN
      private.is_party_gm(p_party_id) OR private.is_party_member(p_party_id)
    ELSE false
  END;
$$;

CREATE FUNCTION private.can_write_container(p_container_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (
      SELECT private.can_write_owner(c.character_id, c.party_id)
      FROM public.containers AS c
      WHERE c.id = p_container_id
    ),
    false
  );
$$;

REVOKE ALL ON FUNCTION private.can_write_owner(uuid, uuid), private.can_write_container(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.can_write_owner(uuid, uuid), private.can_write_container(uuid)
  TO authenticated, service_role;

-- 3. Regras que o CHECK não alcança
--
-- Os triggers de BEFORE UPDATE/DELETE só rodam nas linhas que o RLS já deixou mexer. Os de
-- BEFORE INSERT rodam antes do WITH CHECK do RLS: por isso os limites primeiro perguntam se quem
-- chamou escreve no dono e, se não escreve, devolvem a linha sem contar nada, para o RLS recusar
-- com o erro dele (sem vazar contagem nem existência de linhas de outros). Sem usuário
-- (service_role, migração, seed) o limite vale sempre.

-- O dono de um lugar não muda; algibeira e baú da party não viram outro tipo (nem o contrário) e
-- não se apagam, a não ser junto com o dono (a cascata roda depois de a linha do dono sumir, então
-- ele não existe mais quando chega aqui). A última mochila do personagem também fica: não se
-- apaga nem vira outro tipo enquanto ele existe (o lock por dono, o mesmo do limite de lugares,
-- impede que duas mochilas saiam ao mesmo tempo achando que sobra a outra). SECURITY DEFINER para
-- ver o dono mesmo sem RLS que o mostre.
-- Falha se a mochila p_id é a última do personagem e ele ainda existe
CREATE FUNCTION private.keep_last_backpack(p_id uuid, p_character_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.characters WHERE id = p_character_id) THEN
    RETURN;
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('containers'),
    pg_catalog.hashtext(p_character_id::text)
  );
  IF NOT EXISTS (
    SELECT 1 FROM public.containers
    WHERE character_id = p_character_id AND kind = 'backpack' AND id <> p_id
  ) THEN
    RAISE EXCEPTION USING MESSAGE = 'backpack_required', ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE FUNCTION private.keep_containers()
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
    IF OLD.kind = 'party_chest'
       AND EXISTS (SELECT 1 FROM public.parties WHERE id = OLD.party_id) THEN
      RAISE EXCEPTION USING MESSAGE = 'party_chest_required', ERRCODE = 'P0001';
    END IF;
    IF OLD.kind = 'backpack' THEN
      PERFORM private.keep_last_backpack(OLD.id, OLD.character_id);
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.character_id IS DISTINCT FROM OLD.character_id
     OR NEW.party_id IS DISTINCT FROM OLD.party_id
     OR (NEW.kind = 'coin_pouch') <> (OLD.kind = 'coin_pouch')
     OR (NEW.kind = 'party_chest') <> (OLD.kind = 'party_chest') THEN
    RAISE EXCEPTION USING MESSAGE = 'container_immutable', ERRCODE = 'P0001';
  END IF;
  IF OLD.kind = 'backpack' AND NEW.kind <> 'backpack' THEN
    PERFORM private.keep_last_backpack(OLD.id, OLD.character_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_containers_keep
  BEFORE UPDATE OF kind, character_id, party_id OR DELETE ON public.containers
  FOR EACH ROW
  EXECUTE FUNCTION private.keep_containers();

-- Até 20 lugares por dono. O lock por dono impede que duas inserções ao mesmo tempo passem do
-- limite juntas.
CREATE FUNCTION private.limit_containers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count bigint;
BEGIN
  IF (SELECT auth.uid()) IS NOT NULL
     AND NOT private.can_write_owner(NEW.character_id, NEW.party_id) THEN
    RETURN NEW;
  END IF;
  -- Sem dono ou com os dois: o CHECK recusa depois
  IF num_nonnulls(NEW.character_id, NEW.party_id) <> 1 THEN
    RETURN NEW;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('containers'),
    pg_catalog.hashtext(COALESCE(NEW.character_id, NEW.party_id)::text)
  );
  IF NEW.character_id IS NOT NULL THEN
    SELECT count(*) INTO v_count FROM public.containers WHERE character_id = NEW.character_id;
  ELSE
    SELECT count(*) INTO v_count FROM public.containers WHERE party_id = NEW.party_id;
  END IF;
  IF v_count >= 20 THEN
    RAISE EXCEPTION USING MESSAGE = 'container_limit', ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_containers_limit
  BEFORE INSERT ON public.containers
  FOR EACH ROW
  EXECUTE FUNCTION private.limit_containers();

-- Até 500 entradas por dono, contadas ao inserir e ao mudar de lugar para outro dono. Só olha o
-- lugar de NEW.container_id (e, no UPDATE, o de OLD, que o RLS já deixou mexer).
CREATE FUNCTION private.limit_inventory_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_character uuid;
  v_party uuid;
  v_count bigint;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.container_id = OLD.container_id THEN
    RETURN NEW;
  END IF;

  SELECT character_id, party_id INTO v_character, v_party
  FROM public.containers
  WHERE id = NEW.container_id;
  -- Lugar que não existe: o RLS (ou a chave estrangeira, sem usuário) recusa depois
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  IF (SELECT auth.uid()) IS NOT NULL AND NOT private.can_write_owner(v_character, v_party) THEN
    RETURN NEW;
  END IF;

  -- Mudar de lugar sem mudar de dono não cria entrada
  IF TG_OP = 'UPDATE' AND EXISTS (
    SELECT 1 FROM public.containers
    WHERE id = OLD.container_id
      AND character_id IS NOT DISTINCT FROM v_character
      AND party_id IS NOT DISTINCT FROM v_party
  ) THEN
    RETURN NEW;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('inventory_items'),
    pg_catalog.hashtext(COALESCE(v_character, v_party)::text)
  );

  -- Somar a uma entrada que já está no lugar (upsert) não cria entrada nova. A entrada fica travada
  -- (FOR KEY SHARE) até o fim da transação: sem isso, uma mudança de lugar dentro do mesmo dono
  -- (que não pega o lock do dono) podia tirá-la dali entre esta checagem e o ON CONFLICT, e o
  -- upsert inseria uma 501ª. Se alguém já está mudando a entrada, esperamos e a checagem é refeita
  -- na versão nova da linha; se ela saiu do lugar, conta como entrada nova.
  IF TG_OP = 'INSERT' THEN
    PERFORM 1 FROM public.inventory_items
    WHERE container_id = NEW.container_id AND item_ref = NEW.item_ref
    FOR KEY SHARE;
    IF FOUND THEN
      RETURN NEW;
    END IF;
  END IF;

  IF v_character IS NOT NULL THEN
    SELECT count(*) INTO v_count
    FROM public.inventory_items AS i
    JOIN public.containers AS c ON c.id = i.container_id
    WHERE c.character_id = v_character;
  ELSE
    SELECT count(*) INTO v_count
    FROM public.inventory_items AS i
    JOIN public.containers AS c ON c.id = i.container_id
    WHERE c.party_id = v_party;
  END IF;
  IF v_count >= 500 THEN
    RAISE EXCEPTION USING MESSAGE = 'item_limit', ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_inventory_items_limit
  BEFORE INSERT OR UPDATE OF container_id ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION private.limit_inventory_items();

-- A entrada não muda de item: mover troca container_id, a pilha muda quantity. Uma entrada que vira
-- outro item não tem uso, quebraria o histórico (o id é "esta pilha deste item") e abriria outro
-- jeito de esvaziar o par (container_id, item_ref) por baixo do atalho do upsert acima.
CREATE FUNCTION private.keep_inventory_item_ref()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.item_ref IS DISTINCT FROM OLD.item_ref THEN
    RAISE EXCEPTION USING MESSAGE = 'item_immutable', ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_inventory_items_keep_item_ref
  BEFORE UPDATE OF item_ref ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION private.keep_inventory_item_ref();

-- 4. Algibeira e mochila para todo personagem

-- Os novos, por qualquer caminho (app, duplicar, seed). Criado antes da carga abaixo, para não
-- haver janela em que um personagem novo fique sem os dois.
CREATE FUNCTION private.create_default_containers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.containers (character_id, kind, position)
  VALUES (NEW.id, 'coin_pouch', 0), (NEW.id, 'backpack', 1);
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_characters_default_containers
  AFTER INSERT ON public.characters
  FOR EACH ROW
  EXECUTE FUNCTION private.create_default_containers();

-- Os que já existem (inclusive os apagados com deleted_at, que podem voltar)
INSERT INTO public.containers (character_id, kind, position)
SELECT c.id, 'coin_pouch', 0
FROM public.characters AS c
WHERE NOT EXISTS (
  SELECT 1 FROM public.containers AS cc
  WHERE cc.character_id = c.id AND cc.kind = 'coin_pouch'
);

INSERT INTO public.containers (character_id, kind, position)
SELECT c.id, 'backpack', 1
FROM public.characters AS c
WHERE NOT EXISTS (
  SELECT 1 FROM public.containers AS cc
  WHERE cc.character_id = c.id AND cc.kind = 'backpack'
);

REVOKE ALL ON FUNCTION private.keep_containers() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.keep_last_backpack(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.limit_containers() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.limit_inventory_items() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.keep_inventory_item_ref() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.create_default_containers() FROM PUBLIC, anon, authenticated;

-- 5. RLS e grants (os mesmos de character_spells)

ALTER TABLE public.containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Lugares: quem escreve no dono (dono do personagem; mestre e membros ativos da mesa) faz tudo
CREATE POLICY "writers_can_manage_container" ON public.containers
  FOR ALL TO authenticated
  USING (private.can_write_owner(character_id, party_id))
  WITH CHECK (private.can_write_owner(character_id, party_id));

-- O mestre de uma mesa onde o personagem está lê os lugares dele (como a ficha somente leitura)
CREATE POLICY "containers_select_party_gm" ON public.containers
  FOR SELECT TO authenticated
  USING (character_id IN (SELECT private.gm_readable_character_ids()));

-- Entradas: lê quem lê o lugar (o RLS de containers vale dentro da subconsulta)
CREATE POLICY "inventory_items_select_readable_container" ON public.inventory_items
  FOR SELECT TO authenticated
  USING (container_id IN (SELECT c.id FROM public.containers AS c));

-- Escreve quem escreve no lugar; no UPDATE, no antigo (USING) e no novo (WITH CHECK)
CREATE POLICY "inventory_items_insert_writable_container" ON public.inventory_items
  FOR INSERT TO authenticated
  WITH CHECK (private.can_write_container(container_id));

CREATE POLICY "inventory_items_update_writable_container" ON public.inventory_items
  FOR UPDATE TO authenticated
  USING (private.can_write_container(container_id))
  WITH CHECK (private.can_write_container(container_id));

CREATE POLICY "inventory_items_delete_writable_container" ON public.inventory_items
  FOR DELETE TO authenticated
  USING (private.can_write_container(container_id));

REVOKE ALL ON TABLE public.containers, public.inventory_items
  FROM anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.containers, public.inventory_items
  TO authenticated, service_role;

-- 6. Duplicar copia o inventário
--
-- A cópia já nasce com algibeira e mochila (trigger acima). As moedas da algibeira vão para a
-- algibeira da cópia. A mochila padrão da cópia casa com a primeira mochila do original (todo
-- personagem tem ao menos uma: a última não sai) e assume nome e posição dela. Os demais lugares
-- são criados. Assim a cópia fica com os mesmos lugares e nunca passa do limite de 20. Cada entrada vai para o lugar
-- correspondente da cópia, nunca para o do original.
CREATE OR REPLACE FUNCTION public.duplicate_character(p_character_id uuid, p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
  v_match uuid;
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

  SELECT id INTO v_match
  FROM public.containers
  WHERE character_id = p_character_id AND kind = 'backpack'
  ORDER BY position, created_at, id
  LIMIT 1;

  SELECT id INTO v_copy_pouch
  FROM public.containers
  WHERE character_id = v_id AND kind = 'coin_pouch';

  SELECT id INTO v_copy_backpack
  FROM public.containers
  WHERE character_id = v_id AND kind = 'backpack';

  FOR r IN
    SELECT id, kind, name, position, coins
    FROM public.containers
    WHERE character_id = p_character_id
    ORDER BY position, created_at, id
  LOOP
    IF r.kind = 'coin_pouch' OR r.id = v_match THEN
      v_target := CASE WHEN r.kind = 'coin_pouch' THEN v_copy_pouch ELSE v_copy_backpack END;
      UPDATE public.containers
      SET name = r.name, position = r.position, coins = r.coins
      WHERE id = v_target;
    ELSE
      INSERT INTO public.containers (character_id, kind, name, position, coins)
      VALUES (v_id, r.kind, r.name, r.position, r.coins)
      RETURNING id INTO v_target;
    END IF;

    INSERT INTO public.inventory_items (container_id, item_ref, quantity)
    SELECT v_target, item_ref, quantity
    FROM public.inventory_items
    WHERE container_id = r.id;
  END LOOP;

  RETURN v_id;
END;
$$;

-- 7. Somar ao item que já está no lugar
--
-- Adicionar um item que já está no lugar soma a quantidade, no banco e de uma vez (sem ler e gravar
-- no cliente: duas abas somam as duas). A soma para em 9999, o teto do CHECK. SECURITY INVOKER: o
-- RLS e os limites valem como numa inserção normal.
CREATE OR REPLACE FUNCTION public.add_inventory_item(
  p_container_id uuid,
  p_item_ref text,
  p_quantity integer
)
RETURNS public.inventory_items
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  INSERT INTO public.inventory_items (container_id, item_ref, quantity)
  VALUES (p_container_id, p_item_ref, p_quantity)
  ON CONFLICT (container_id, item_ref) DO UPDATE
    SET quantity = LEAST(public.inventory_items.quantity + EXCLUDED.quantity, 9999)
  RETURNING *;
$$;

REVOKE ALL ON FUNCTION public.add_inventory_item(uuid, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_inventory_item(uuid, text, integer)
  TO authenticated, service_role;
