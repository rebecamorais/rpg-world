-- Dados de vida: a ficha passa a guardar o dado e quantos foram GASTOS ({ "die": "d8", "spent": 2 }),
-- no lugar do texto com o total e dos dados restantes ({ "total": "5d8", "current": 3 }). Os
-- restantes saem do nível: descer de nível e voltar deixa de alterar o que a jogadora gastou.
--
-- Nenhuma linha é reescrita aqui. A ficha antiga continua como está e o app lê os dois formatos;
-- ela passa para o formato novo quando for gravada de novo.
--
-- O que muda é o que conta para a revisão da ficha (private.character_sheet_fields, do trigger
-- trg_characters_revision): dos dados de vida conta só o DADO, lido de qualquer um dos formatos.
-- Assim "spent" é estado de jogo como "current" já era, e a primeira gravação de uma ficha antiga
-- no formato novo não sobe a revisão (não vira um 409 no rascunho de quem está com a ficha aberta).
-- O resto da função é igual ao de 20261115131834_concurrent_writes.sql.
CREATE OR REPLACE FUNCTION private.character_sheet_fields(p_row public.characters)
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
        -- O dado: o do formato novo se for um dos quatro, senão o do fim do total antigo
        -- ("5d10" -> "d10"). Sem dado reconhecido, um objeto vazio nos dois formatos.
        'hitDice', CASE WHEN jsonb_typeof(sd.v -> 'hitDice') = 'object'
          THEN jsonb_strip_nulls(jsonb_build_object('die', COALESCE(
            CASE WHEN sd.v #>> '{hitDice,die}' IN ('d6', 'd8', 'd10', 'd12')
              THEN sd.v #>> '{hitDice,die}' END,
            substring(sd.v #>> '{hitDice,total}' FROM '(d6|d8|d10|d12)$')
          )))
          ELSE sd.v -> 'hitDice' END,
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
