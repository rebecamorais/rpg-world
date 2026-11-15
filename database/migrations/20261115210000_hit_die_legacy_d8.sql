-- Dado de vida: uma ficha sem dado salvo passa a seguir a classe (#181, fase 3.1). Até aqui ela
-- mostrava d8. Toda ficha que já existe precisa continuar mostrando o que mostra, então as que
-- não têm um dado reconhecido ganham o d8 gravado, como valor da própria ficha. As fichas criadas
-- depois desta migração nascem sem dado e herdam o da classe: é a data da migração que separa
-- as antigas das novas, não uma regra do servidor.
--
-- - Só fichas de D&D 5e.
-- - Dado reconhecido fica como está: `die` em d6/d8/d10/d12 (formato atual) ou `total` terminando
--   em um deles (formato antigo, "5d10").
-- - Os dados gastos não mudam. No formato atual, `spent` fica. No antigo sem dado reconhecido, a
--   ficha passa para o formato atual com spent = nível - current (nunca abaixo de 0), que é a
--   conta que a leitura já fazia: os restantes continuam os mesmos.
-- - Rodar de novo não muda nada: depois da primeira vez toda ficha tem um dado reconhecido.
-- - Nas linhas alteradas a revisão sobe sozinha (trg_characters_revision): o dado é da ficha.
--
-- Quantas linhas seriam alteradas, sem alterar nada:
--   SELECT count(*) FROM public.characters c
--   WHERE c.system = 'dnd_5e' AND jsonb_typeof(c.system_data) = 'object'
--     AND NOT COALESCE(
--       CASE WHEN jsonb_typeof(c.system_data -> 'hitDice') <> 'object' THEN false
--         WHEN (c.system_data -> 'hitDice') ?| ARRAY['die', 'spent']
--           THEN c.system_data #>> '{hitDice,die}' IN ('d6', 'd8', 'd10', 'd12')
--         ELSE jsonb_typeof(c.system_data #> '{hitDice,total}') = 'string'
--           AND c.system_data #>> '{hitDice,total}' ~ '(d6|d8|d10|d12)$' END,
--       false);

UPDATE public.characters AS c
SET system_data = jsonb_set(
  c.system_data,
  '{hitDice}',
  CASE
    -- Formato atual sem dado válido: só o dado entra, o resto do objeto fica
    WHEN h.is_object AND h.hd ?| ARRAY['die', 'spent'] THEN h.hd || '{"die": "d8"}'::jsonb
    -- Formato antigo sem dado reconhecido: passa para o atual, com os mesmos dados restantes
    WHEN h.is_object THEN jsonb_build_object(
      'die', 'd8',
      'spent', CASE WHEN jsonb_typeof(h.hd -> 'current') = 'number'
        THEN GREATEST(trunc(c.level - (h.hd ->> 'current')::numeric), 0) ELSE 0 END
    )
    -- Sem dados de vida salvos
    ELSE '{"die": "d8", "spent": 0}'::jsonb
  END
)
FROM (
  SELECT id,
    COALESCE(jsonb_typeof(system_data -> 'hitDice') = 'object', false) AS is_object,
    system_data -> 'hitDice' AS hd
  FROM public.characters
  WHERE system = 'dnd_5e' AND jsonb_typeof(system_data) = 'object'
) AS h
WHERE c.id = h.id
  AND NOT COALESCE(
    CASE WHEN NOT h.is_object THEN false
      WHEN h.hd ?| ARRAY['die', 'spent'] THEN h.hd ->> 'die' IN ('d6', 'd8', 'd10', 'd12')
      ELSE jsonb_typeof(h.hd -> 'total') = 'string'
        AND h.hd ->> 'total' ~ '(d6|d8|d10|d12)$' END,
    false);
