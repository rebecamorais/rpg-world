-- Salvaguardas: a ficha passa a guardar só as que a pessoa definiu à mão. Uma salvaguarda sem
-- valor salvo segue a classe (#181, fase 3.1).
--
-- Toda ficha existente precisa continuar exatamente como está. Até aqui o servidor completava as
-- seis com "não proficiente" ao ler e gravava as seis de volta, então quase toda ficha já tem as
-- seis salvas. Esta migração garante o mesmo para as que não têm (criadas por seed ou por um
-- caminho antigo): o que faltar vira "não proficiente" gravado, que é o que a ficha mostrava.
-- Só mexe nas linhas em que falta alguma das seis; onde já há valor, ele fica.

UPDATE public.characters
SET system_data = jsonb_set(
  system_data,
  '{savingThrowProficiencies}',
  '{"STR": false, "DEX": false, "CON": false, "INT": false, "WIS": false, "CHA": false}'::jsonb
    || CASE WHEN jsonb_typeof(system_data -> 'savingThrowProficiencies') = 'object'
      THEN system_data -> 'savingThrowProficiencies' ELSE '{}'::jsonb END
)
WHERE jsonb_typeof(system_data) = 'object'
  AND NOT (
    CASE WHEN jsonb_typeof(system_data -> 'savingThrowProficiencies') = 'object'
      THEN system_data -> 'savingThrowProficiencies' ELSE '{}'::jsonb END
  ) ?& ARRAY['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
