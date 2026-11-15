-- Moeda digitada à mão no campo: o número é o VALOR FINAL, não uma diferença (decisão de
-- 2026-11-15, docs/revisao-telas/fase-2-resultados.md, causa 2). Pagar e Receber continuam somando
-- (change_container_coins).
--
-- Junto com o valor vai o que a tela mostrava quando a pessoa começou a digitar. Se o banco não
-- tem mais esse valor (o mestre deu +5 nesse meio-tempo), nada é gravado e a função falha com
-- 'coins_changed', com as moedas de agora no DETAIL: o app diz "Mudou em outro lugar: agora são
-- 55 PO" em vez de gravar por cima do que a outra pessoa fez.
--
-- Só acrescenta: change_container_coins e o PUT de valor absoluto continuam como estão.

-- Grava p_coins ({ "gp": 70 }, só as moedas digitadas) no lugar p_container_id do dono p_owner_id
-- (personagem ou mesa), se cada uma ainda vale o que está em p_expected ({ "gp": 50 }, as mesmas
-- moedas). Devolve as moedas depois de gravar, ou null quando o lugar não é desse dono ou quem
-- chama não o vê. Chave repetida (um reenvio de algo que já gravou): não confere nem grava de novo
-- e devolve as moedas de agora.
CREATE FUNCTION public.set_container_coins_if_unchanged(
  p_owner_id uuid,
  p_container_id uuid,
  p_coins jsonb,
  p_expected jsonb,
  p_key uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_coins jsonb;
BEGIN
  IF p_coins IS NULL OR p_expected IS NULL
    OR jsonb_typeof(p_coins) <> 'object'
    OR jsonb_typeof(p_expected) <> 'object'
    OR p_coins = '{}'::jsonb
    OR p_coins - ARRAY['cp', 'sp', 'ep', 'gp', 'pp'] <> '{}'::jsonb
    -- As mesmas moedas nos dois: cada valor digitado tem o seu valor de antes
    OR ARRAY(SELECT jsonb_object_keys(p_coins) ORDER BY 1)
      <> ARRAY(SELECT jsonb_object_keys(p_expected) ORDER BY 1)
    OR jsonb_path_exists(p_coins, '$.* ? (@.type() != "number" || @ != @.floor() || @ < 0)')
    OR jsonb_path_exists(p_expected, '$.* ? (@.type() != "number" || @ != @.floor() || @ < 0)')
  THEN
    RAISE EXCEPTION USING MESSAGE = 'invalid_coins', ERRCODE = 'P0001';
  END IF;

  -- FOR UPDATE, como em change_container_coins: quem chega depois espera, e com RLS só acha a
  -- linha quem pode escrevê-la
  SELECT c.coins INTO v_coins
  FROM public.containers AS c
  WHERE c.id = p_container_id AND p_owner_id IN (c.character_id, c.party_id)
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Antes de conferir: o reenvio de uma escrita que já gravou acha o valor novo, não o de antes
  IF NOT private.claim_write_operation(p_key) THEN
    RETURN v_coins;
  END IF;

  -- @> compara número com número (50 e 50.0 são iguais). A exceção desfaz a chave também, então
  -- a mesma chave ainda serve se a pessoa tentar de novo.
  IF NOT v_coins @> p_expected THEN
    RAISE EXCEPTION USING MESSAGE = 'coins_changed', DETAIL = v_coins::text, ERRCODE = 'P0001';
  END IF;

  -- O teto de cada moeda (1.000.000.000) é o CHECK da tabela
  UPDATE public.containers
  SET coins = v_coins || p_coins
  WHERE id = p_container_id
  RETURNING coins INTO v_coins;
  RETURN v_coins;
END;
$$;

REVOKE ALL ON FUNCTION public.set_container_coins_if_unchanged(uuid, uuid, jsonb, jsonb, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_container_coins_if_unchanged(uuid, uuid, jsonb, jsonb, uuid)
  TO authenticated, service_role;
