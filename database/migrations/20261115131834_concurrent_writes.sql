-- Escritas concorrentes: duas abas (ou mestre e jogadora) mexendo na mesma coisa ao mesmo tempo.
-- Até aqui moedas, quantidades e condições iam como valor final, e a última escrita apagava a
-- outra (baú com 250 PO, +1 em cada aba: 251). Agora:
--
-- 1. Chave de idempotência: cada operação leva uma chave (uuid do cliente). Repetir a mesma
--    requisição (um "Tentar de novo", um reenvio da rede) não aplica duas vezes.
-- 2. Moedas e quantidades como operação: somar ou tirar, no banco, com a linha travada. A mesma
--    regra de quem escreve (RLS), porque as funções são SECURITY INVOKER, como add_inventory_item.
-- 3. Condições como operação: ligar, mudar o nível ou desligar UMA condição. SECURITY DEFINER,
--    como set_participant_conditions (o jogador mexe no próprio participante, o RLS não deixaria).
-- 4. Revisão da ficha: characters.revision sobe quando um UPDATE muda o que se edita no rascunho
--    da ficha (trigger, na mesma transação). O app compara com a revisão que o cliente viu e
--    responde 409 quando mudou. Estado de jogo (PV, espaços gastos, testes contra a morte...) não
--    sobe a revisão: o mestre dar dano no combate não pode virar conflito no rascunho da jogadora.
--    characters.row_version sobe em todo UPDATE: é o compare-and-set do app, que regrava a linha
--    inteira e não pode apagar um dano que chegou entre a leitura e a escrita.
--
-- Nada é apagado: as funções antigas (valor absoluto) continuam, para o app já publicado.

-- 1. Chaves de idempotência
--
-- No schema private: a Data API não expõe a tabela; as funções abaixo (que rodam como quem chama)
-- gravam nela. Cada usuário só vê e grava as próprias chaves. Ficam um dia: o bastante para um
-- reenvio, e quem chama limpa as próprias chaves velhas.
CREATE TABLE private.write_operations (
  user_id    uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  key        uuid        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);

CREATE INDEX write_operations_user_created_idx
  ON private.write_operations (user_id, created_at);

ALTER TABLE private.write_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "write_operations_own" ON private.write_operations
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

REVOKE ALL ON TABLE private.write_operations FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, DELETE ON TABLE private.write_operations TO authenticated, service_role;

-- true quando a chave é nova (a operação deve rodar); false quando já rodou. Sem chave, sempre
-- roda. Duas requisições com a mesma chave ao mesmo tempo: a segunda espera a primeira no índice
-- da chave primária e, se ela gravou, recebe false. Se a primeira falhar, a chave vai junto no
-- rollback e a segunda roda.
CREATE FUNCTION private.claim_write_operation(p_key uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
BEGIN
  IF p_key IS NULL OR v_uid IS NULL THEN
    RETURN true;
  END IF;

  DELETE FROM private.write_operations
  WHERE user_id = v_uid AND created_at < now() - interval '1 day';

  INSERT INTO private.write_operations (user_id, key)
  VALUES (v_uid, p_key)
  ON CONFLICT DO NOTHING;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION private.claim_write_operation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.claim_write_operation(uuid) TO authenticated, service_role;

-- 2. Moedas e quantidades

-- Soma p_delta ({ "gp": 1, "sp": -3 }, só as moedas que mudam) às moedas do lugar p_container_id
-- do dono p_owner_id (personagem ou mesa). Devolve as moedas depois da soma, ou null quando o lugar
-- não é desse dono ou quem chama não o vê. Uma moeda que ficaria negativa falha com
-- 'not_enough_coins' (outra aba gastou antes); o teto é o do CHECK (1.000.000.000), como a soma de
-- itens para em 9999. Chave repetida: não soma de novo e devolve as moedas de agora.
CREATE FUNCTION public.change_container_coins(
  p_owner_id uuid,
  p_container_id uuid,
  p_delta jsonb,
  p_key uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_coins jsonb;
  v_next jsonb := '{}'::jsonb;
  v_denomination text;
  v_value numeric;
BEGIN
  IF jsonb_typeof(p_delta) <> 'object'
    OR p_delta - ARRAY['cp', 'sp', 'ep', 'gp', 'pp'] <> '{}'::jsonb
    OR jsonb_path_exists(p_delta, '$.* ? (@.type() != "number" || @ != @.floor())')
  THEN
    RAISE EXCEPTION USING MESSAGE = 'invalid_coins', ERRCODE = 'P0001';
  END IF;

  -- FOR UPDATE: a outra aba espera esta terminar e soma sobre o valor novo. Com RLS, o FOR UPDATE
  -- só acha a linha se quem chama pode escrevê-la (política de UPDATE), então isto já confere a
  -- permissão.
  SELECT c.coins INTO v_coins
  FROM public.containers AS c
  WHERE c.id = p_container_id AND p_owner_id IN (c.character_id, c.party_id)
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- A chave só é gasta depois de achar a linha: um null (ou 404) não queima a chave
  IF NOT private.claim_write_operation(p_key) THEN
    RETURN v_coins;
  END IF;

  FOREACH v_denomination IN ARRAY ARRAY['cp', 'sp', 'ep', 'gp', 'pp'] LOOP
    v_value := (v_coins ->> v_denomination)::numeric
      + coalesce((p_delta ->> v_denomination)::numeric, 0);
    IF v_value < 0 THEN
      RAISE EXCEPTION USING MESSAGE = 'not_enough_coins', ERRCODE = 'P0001';
    END IF;
    v_next := v_next || jsonb_build_object(v_denomination, LEAST(v_value, 1000000000));
  END LOOP;

  UPDATE public.containers
  SET coins = v_next
  WHERE id = p_container_id;
  RETURN v_next;
END;
$$;

REVOKE ALL ON FUNCTION public.change_container_coins(uuid, uuid, jsonb, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.change_container_coins(uuid, uuid, jsonb, uuid)
  TO authenticated, service_role;

-- Soma p_delta (positivo ou negativo) à quantidade da entrada p_item_id de um lugar do dono
-- p_owner_id. Devolve a quantidade nova, ou null quando a entrada não é desse dono (ou já saiu).
-- Abaixo de 1 falha com 'item_quantity_conflict': quem tirou a última foi outra aba, e remover
-- continua sendo o DELETE (que tem Desfazer). O teto é 9999, como em add_inventory_item.
CREATE FUNCTION public.change_inventory_item_quantity(
  p_owner_id uuid,
  p_item_id uuid,
  p_delta integer,
  p_key uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_quantity integer;
BEGIN
  -- FOR UPDATE OF i: trava a entrada e, com RLS, só a acha quem pode escrevê-la
  SELECT i.quantity INTO v_quantity
  FROM public.inventory_items AS i
  JOIN public.containers AS c ON c.id = i.container_id
  WHERE i.id = p_item_id AND p_owner_id IN (c.character_id, c.party_id)
  FOR UPDATE OF i;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- A chave só é gasta depois de achar a entrada: um null (ou 404) não queima a chave
  IF NOT private.claim_write_operation(p_key) THEN
    RETURN v_quantity;
  END IF;

  v_quantity := v_quantity + p_delta;
  IF v_quantity < 1 THEN
    RAISE EXCEPTION USING MESSAGE = 'item_quantity_conflict', ERRCODE = 'P0001';
  END IF;

  UPDATE public.inventory_items
  SET quantity = LEAST(v_quantity, 9999)
  WHERE id = p_item_id
  RETURNING quantity INTO v_quantity;
  RETURN v_quantity;
END;
$$;

REVOKE ALL ON FUNCTION public.change_inventory_item_quantity(uuid, uuid, integer, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.change_inventory_item_quantity(uuid, uuid, integer, uuid)
  TO authenticated, service_role;

-- add_inventory_item com chave: o "Desfazer" de uma remoção e o "+" de adicionar somam, então um
-- reenvio somaria duas vezes. Chave repetida devolve a entrada como está, sem somar.
CREATE FUNCTION public.add_inventory_item_once(
  p_container_id uuid,
  p_item_ref text,
  p_quantity integer,
  p_key uuid
)
RETURNS public.inventory_items
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_row public.inventory_items;
BEGIN
  IF NOT private.claim_write_operation(p_key) THEN
    SELECT * INTO v_row
    FROM public.inventory_items
    WHERE container_id = p_container_id AND item_ref = p_item_ref;
    IF FOUND THEN
      RETURN v_row;
    END IF;
    -- A entrada saiu depois da primeira vez: soma de novo, como se a chave fosse nova
  END IF;

  RETURN public.add_inventory_item(p_container_id, p_item_ref, p_quantity);
END;
$$;

REVOKE ALL ON FUNCTION public.add_inventory_item_once(uuid, text, integer, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_inventory_item_once(uuid, text, integer, uuid)
  TO authenticated, service_role;

-- 3. Uma condição por vez
--
-- Liga (ou muda o nível de) p_key quando p_active, desliga quando não. A lista dos outros fica
-- como está no banco, então mestre e jogadora ligando condições diferentes ficam com as duas.
-- Mesmas permissões e mesmas respostas de set_participant_conditions: false quando o participante
-- não é desta mesa ou quem chama não pode. Ligar de novo e desligar o que já está desligado não
-- mudam nada, por isso não precisa de chave. Formato inválido falha pelo CHECK (23514).
CREATE FUNCTION public.change_participant_condition(
  p_party_id uuid,
  p_participant_id uuid,
  p_key text,
  p_level integer,
  p_active boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_side text;
  v_character uuid;
  v_owner uuid;
  v_conditions jsonb;
  v_entry jsonb := jsonb_build_object('key', p_key, 'level', p_level);
  v_next jsonb;
BEGIN
  -- Permissão primeiro, sem travar: quem não pode não segura a linha de quem pode
  SELECT ep.side, ep.character_id, c.owner_id
  INTO v_side, v_character, v_owner
  FROM public.encounter_participants AS ep
  JOIN public.characters AS c ON c.id = ep.character_id
  WHERE ep.id = p_participant_id AND ep.party_id = p_party_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF NOT (
    private.is_party_gm(p_party_id)
    OR (
      v_side = 'player'
      AND v_uid IS NOT NULL
      AND v_owner = v_uid
      AND private.is_party_member(p_party_id)
      AND EXISTS (
        SELECT 1 FROM public.party_characters AS pc
        WHERE pc.party_id = p_party_id AND pc.character_id = v_character
      )
    )
  ) THEN
    RETURN false;
  END IF;

  -- FOR UPDATE: quem chega depois espera e parte da lista já gravada. O lado e o personagem não
  -- mudam depois de criado o participante; se ele saiu nesse meio-tempo, não acha.
  SELECT ep.conditions INTO v_conditions
  FROM public.encounter_participants AS ep
  WHERE ep.id = p_participant_id AND ep.party_id = p_party_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Mantém a ordem: a condição que já estava fica no lugar dela, a nova vai para o fim
  SELECT coalesce(
    jsonb_agg(CASE WHEN t.value ->> 'key' = p_key THEN v_entry ELSE t.value END ORDER BY t.ord)
      FILTER (WHERE p_active OR t.value ->> 'key' <> p_key),
    '[]'::jsonb
  )
  INTO v_next
  FROM jsonb_array_elements(v_conditions) WITH ORDINALITY AS t(value, ord);

  IF p_active AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_conditions) AS e WHERE e.value ->> 'key' = p_key
  ) THEN
    v_next := v_next || jsonb_build_array(v_entry);
  END IF;

  UPDATE public.encounter_participants
  SET conditions = v_next
  WHERE id = p_participant_id AND party_id = p_party_id;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.change_participant_condition(uuid, uuid, text, integer, boolean)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.change_participant_condition(uuid, uuid, text, integer, boolean)
  TO authenticated, service_role;

-- 4. Revisão da ficha
--
-- Duas colunas, as duas começando em 0 (default constante: não reescreve a tabela). O valor
-- mandado no UPDATE é ignorado nas duas, então o cliente não escolhe nenhuma.
--
-- revision: sobe quando muda o que se edita no rascunho da ficha (atributos, CA, nível, nome,
-- cards...). Não sobe com estado de jogo, que salva na hora e chega de vários lugares (a jogadora,
-- o mestre no combate, o descanso): PV atual, PV temporário, testes contra a morte, espaços e
-- pontos de magia gastos, recursos gastos, dados de vida restantes; nem com avatar e fundo, que
-- têm o próprio envio. Quem salva o rascunho com a revisão antiga perde para quem salvou antes, e
-- o app avisa (409).
--
-- row_version: sobe em todo UPDATE. É o compare-and-set do app, que regrava a linha inteira: sem
-- ele, um dano do mestre entre a leitura e a escrita voltaria ao valor antigo.
ALTER TABLE public.characters
  ADD COLUMN revision bigint NOT NULL DEFAULT 0,
  ADD COLUMN row_version bigint NOT NULL DEFAULT 0;

-- O que conta para a revisão: a linha sem as colunas de estado de jogo, e o system_data sem as
-- chaves de estado de jogo. Um recurso que fica vazio sem o "used" ({ used: 1 } da primeira vez
-- que se gasta) conta como ausente, para gastar pela primeira vez não subir a revisão.
CREATE FUNCTION private.character_sheet_fields(p_row public.characters)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  WITH sd AS (
    SELECT CASE WHEN jsonb_typeof(p_row.system_data) = 'object'
      THEN p_row.system_data ELSE '{}'::jsonb END AS v
  )
  SELECT (
    to_jsonb(p_row)
      - ARRAY['hp_current', 'avatar_url', 'sheet_background_url', 'updated_at', 'revision',
        'row_version', 'system_data']
  ) || jsonb_build_object('system_data', (
    SELECT (sd.v - ARRAY['hpTemp', 'deathSaves', 'spellSlots', 'spellPoints', 'hitDice',
      'resources'])
      || jsonb_build_object(
        'spellSlots', (
          SELECT jsonb_object_agg(e.key, CASE WHEN jsonb_typeof(e.value) = 'object'
            THEN e.value - 'used' ELSE e.value END)
          FROM jsonb_each(CASE WHEN jsonb_typeof(sd.v -> 'spellSlots') = 'object'
            THEN sd.v -> 'spellSlots' ELSE '{}'::jsonb END) AS e
        ),
        'spellPoints', CASE WHEN jsonb_typeof(sd.v -> 'spellPoints') = 'object'
          THEN (sd.v -> 'spellPoints') - 'current' ELSE sd.v -> 'spellPoints' END,
        'hitDice', CASE WHEN jsonb_typeof(sd.v -> 'hitDice') = 'object'
          THEN (sd.v -> 'hitDice') - 'current' ELSE sd.v -> 'hitDice' END,
        'resources', (
          SELECT jsonb_object_agg(e.key, CASE WHEN jsonb_typeof(e.value) = 'object'
            THEN e.value - 'used' ELSE e.value END)
          FROM jsonb_each(CASE WHEN jsonb_typeof(sd.v -> 'resources') = 'object'
            THEN sd.v -> 'resources' ELSE '{}'::jsonb END) AS e
          WHERE jsonb_typeof(e.value) <> 'object' OR e.value - 'used' <> '{}'::jsonb
        )
      )
    FROM sd
  ));
$$;

-- O trigger roda como quem atualiza a linha, então quem atualiza também chama esta
REVOKE ALL ON FUNCTION private.character_sheet_fields(public.characters) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.character_sheet_fields(public.characters)
  TO authenticated, service_role;

CREATE FUNCTION private.bump_character_revision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.row_version := OLD.row_version + 1;
  NEW.revision := OLD.revision + CASE
    WHEN private.character_sheet_fields(OLD) IS DISTINCT FROM private.character_sheet_fields(NEW)
    THEN 1 ELSE 0 END;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.bump_character_revision() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_characters_revision
  BEFORE UPDATE ON public.characters
  FOR EACH ROW
  EXECUTE FUNCTION private.bump_character_revision();
