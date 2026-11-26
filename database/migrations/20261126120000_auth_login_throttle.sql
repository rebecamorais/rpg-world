-- Limite de tentativas de senha no login. O limite do Auth conta o IP do servidor, que é o mesmo
-- para todo mundo, então sem isto dá para testar senhas de uma conta sem parar.
--
-- Duas chaves por tentativa: o e-mail (5 senhas erradas em 15 minutos) e o IP de quem pede (20 em
-- 15 minutos, mais folgado porque uma casa ou uma escola dividem o IP). Passou do limite, a chave
-- fica travada por 15 minutos contados da última senha errada. Pedido sem IP conta só o e-mail.
--
-- A chave é por e-mail, e não por conta: um e-mail sem conta trava igual, então a resposta não diz
-- se a conta existe. Guarda só o hash (SHA-256, feito no servidor do app) do e-mail normalizado e
-- do IP, nunca o texto. Sem chave estrangeira, então a linha não sai com a conta: some sozinha
-- depois da janela (prune no fim de finish_login_attempt). RLS ligado, sem política, só o
-- service_role.
CREATE TABLE public.auth_login_throttle (
  scope          TEXT          NOT NULL CHECK (scope IN ('email', 'ip')),
  key_hash       TEXT          NOT NULL CHECK (key_hash ~ '^[0-9a-f]{64}$'),
  failed_at      TIMESTAMPTZ[] NOT NULL DEFAULT '{}',
  locked_until   TIMESTAMPTZ,
  last_failed_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, key_hash)
);

-- Para o prune achar as linhas vencidas sem varrer a tabela
CREATE INDEX auth_login_throttle_last_failed_at_idx ON public.auth_login_throttle (last_failed_at);

ALTER TABLE public.auth_login_throttle ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.auth_login_throttle FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.auth_login_throttle TO service_role;

-- Reserva uma tentativa de senha antes de perguntar ao Auth: se só contasse depois da resposta,
-- tentativas simultâneas veriam todas o mesmo total e passariam juntas (como no
-- claim_account_deletion_password_attempt). Devolve 0 quando pode tentar, ou quantos segundos
-- faltam para destravar. Uma chave travada recusa sem contar nada nas duas. Trava sempre o e-mail
-- antes do IP, a mesma ordem em todas as funções, para duas chamadas não esperarem uma pela outra.
CREATE FUNCTION public.claim_login_attempt(p_email_hash text, p_ip_hash text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_window CONSTANT interval := interval '15 minutes';
  v_lockout CONSTANT interval := interval '15 minutes';
  v_scopes text[] := ARRAY['email'];
  v_keys text[] := ARRAY[p_email_hash];
  v_limits int[] := ARRAY[5];
  v_attempts timestamptz[];
  v_locked_until timestamptz;
  v_recent timestamptz[];
  v_wait interval := interval '0';
BEGIN
  IF p_ip_hash IS NOT NULL THEN
    v_scopes := v_scopes || 'ip'::text;
    v_keys := v_keys || p_ip_hash;
    v_limits := v_limits || 20;
  END IF;

  -- Primeiro trava as linhas e confere se alguma está travada, sem mudar nada
  FOR i IN 1 .. cardinality(v_keys) LOOP
    INSERT INTO public.auth_login_throttle (scope, key_hash)
    VALUES (v_scopes[i], v_keys[i])
    ON CONFLICT (scope, key_hash) DO NOTHING;

    -- Lê no próprio SELECT que trava: depois de esperar, ele enxerga o valor novo da linha
    SELECT locked_until INTO v_locked_until
    FROM public.auth_login_throttle
    WHERE scope = v_scopes[i] AND key_hash = v_keys[i]
    FOR UPDATE;

    IF v_locked_until > now() THEN
      v_wait := greatest(v_wait, v_locked_until - now());
    END IF;
  END LOOP;

  IF v_wait > interval '0' THEN
    RETURN ceil(extract(epoch FROM v_wait))::integer;
  END IF;

  -- Nenhuma travada: conta a tentativa nas duas. A que chega ao limite trava já, e a tentativa
  -- que a travou ainda passa (a 5ª senha errada é respondida; a 6ª é recusada)
  FOR i IN 1 .. cardinality(v_keys) LOOP
    SELECT failed_at INTO v_attempts
    FROM public.auth_login_throttle
    WHERE scope = v_scopes[i] AND key_hash = v_keys[i];

    v_recent := array(
      SELECT attempt FROM unnest(v_attempts) AS attempt
      WHERE attempt > now() - v_window
      ORDER BY attempt
    ) || now();

    UPDATE public.auth_login_throttle
    SET failed_at = v_recent,
        last_failed_at = now(),
        locked_until = CASE WHEN cardinality(v_recent) >= v_limits[i] THEN now() + v_lockout END
    WHERE scope = v_scopes[i] AND key_hash = v_keys[i];
  END LOOP;

  RETURN 0;
END;
$$;

-- Devolve a tentativa reservada quando a resposta não foi "senha errada" (o Auth fora do ar, o
-- limite do próprio Auth) e destrava se ela tinha travado. Com p_success, a senha estava certa:
-- o e-mail volta a zero, e o IP só devolve a tentativa (uma conta própria não zera o IP de quem
-- testa as dos outros). No fim, apaga algumas linhas vencidas, sem esperar por nenhuma.
CREATE FUNCTION public.finish_login_attempt(
  p_email_hash text,
  p_ip_hash text DEFAULT NULL,
  p_success boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF p_success THEN
    DELETE FROM public.auth_login_throttle
    WHERE scope = 'email' AND key_hash = p_email_hash;
  ELSE
    UPDATE public.auth_login_throttle
    SET failed_at = failed_at[1:cardinality(failed_at) - 1],
        locked_until = CASE WHEN cardinality(failed_at) - 1 >= 5 THEN locked_until END
    WHERE scope = 'email' AND key_hash = p_email_hash;
  END IF;

  IF p_ip_hash IS NOT NULL THEN
    UPDATE public.auth_login_throttle
    SET failed_at = failed_at[1:cardinality(failed_at) - 1],
        locked_until = CASE WHEN cardinality(failed_at) - 1 >= 20 THEN locked_until END
    WHERE scope = 'ip' AND key_hash = p_ip_hash;
  END IF;

  -- Vencida: a última senha errada passou da janela e do bloqueio (os dois de 15 minutos). SKIP
  -- LOCKED e por último: as linhas desta chamada já estão travadas, e esta parte não espera nada.
  DELETE FROM public.auth_login_throttle
  WHERE ctid IN (
    SELECT ctid FROM public.auth_login_throttle
    WHERE last_failed_at < now() - interval '15 minutes'
      AND (locked_until IS NULL OR locked_until < now())
    LIMIT 100
    FOR UPDATE SKIP LOCKED
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_login_attempt(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finish_login_attempt(text, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_login_attempt(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_login_attempt(text, text, boolean) TO service_role;
