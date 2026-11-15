-- Salvaguardas: a ficha passa a guardar só as que a pessoa definiu à mão. Uma salvaguarda sem
-- valor salvo segue a classe (#181, fase 3.1).
--
-- Toda ficha existente precisa continuar exatamente como está. Até aqui o servidor completava as
-- seis com "não proficiente" ao ler e gravava as seis de volta, então quase toda ficha já tem as
-- seis salvas. Esta migração garante o mesmo para as que não têm (criadas por seed ou por um
-- caminho antigo): o que faltar vira "não proficiente" gravado, que é o que a ficha mostrava.
--
-- - Só fichas de D&D 5e: as de outro sistema não ganham o campo.
-- - "Faltar" é não ter um booleano: chave ausente, null ou outro tipo. Um booleano salvo fica.
-- - Só mexe nas linhas em que falta alguma das seis, então rodar de novo não muda nada.
-- - Nas linhas alteradas a revisão sobe sozinha (trg_characters_revision): o campo é da ficha.
--
-- Quantas linhas seriam alteradas, sem alterar nada:
--   SELECT count(*) FROM public.characters c
--   WHERE c.system = 'dnd_5e' AND jsonb_typeof(c.system_data) = 'object'
--     AND EXISTS (
--       SELECT 1 FROM unnest(ARRAY['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']) AS k
--       WHERE jsonb_typeof(c.system_data -> 'savingThrowProficiencies' -> k)
--         IS DISTINCT FROM 'boolean'
--     );

UPDATE public.characters AS c
SET system_data = jsonb_set(
  c.system_data,
  '{savingThrowProficiencies}',
  s.saved || (
    SELECT jsonb_object_agg(
      k,
      CASE WHEN jsonb_typeof(s.saved -> k) = 'boolean' THEN s.saved -> k ELSE 'false'::jsonb END
    )
    FROM unnest(ARRAY['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']) AS k
  )
)
FROM (
  SELECT id,
    CASE WHEN jsonb_typeof(system_data -> 'savingThrowProficiencies') = 'object'
      THEN system_data -> 'savingThrowProficiencies' ELSE '{}'::jsonb END AS saved
  FROM public.characters
  WHERE system = 'dnd_5e' AND jsonb_typeof(system_data) = 'object'
) AS s
WHERE c.id = s.id
  AND EXISTS (
    SELECT 1 FROM unnest(ARRAY['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']) AS k
    WHERE jsonb_typeof(s.saved -> k) IS DISTINCT FROM 'boolean'
  );
