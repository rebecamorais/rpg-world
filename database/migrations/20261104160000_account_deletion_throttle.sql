-- Limites por conta no pedido de exclusão. A rota envia e-mail sem Turnstile, e o limite do Auth
-- conta o IP do servidor, que é o mesmo para todo mundo: sem isto, uma conta sem senha pede e-mails
-- sem parar, e uma sessão roubada testa senhas até o limite geral.
--
-- Tabela própria, e não colunas em account_deletion_requests, porque pedir de novo substitui a linha
-- do pedido, e o limite não pode depender dela. Sai com a conta. RLS ligado, sem política, só o
-- service_role. As funções não são SECURITY DEFINER porque o service_role já alcança a tabela.
CREATE TABLE public.account_deletion_throttle (
  user_id            UUID          PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  last_email_at      TIMESTAMPTZ,
  failed_password_at TIMESTAMPTZ[] NOT NULL DEFAULT '{}'
);

ALTER TABLE public.account_deletion_throttle ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.account_deletion_throttle FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.account_deletion_throttle TO service_role;

-- Reserva uma tentativa de senha antes de perguntar ao Auth, no máximo 5 em 15 minutos. Se só
-- contasse depois da resposta, tentativas simultâneas veriam todas o mesmo total e passariam juntas;
-- a linha travada faz cada uma esperar a anterior. A janela desliza: cada tentativa vence sozinha.
CREATE FUNCTION public.claim_account_deletion_password_attempt(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_attempts timestamptz[];
  v_recent timestamptz[];
BEGIN
  INSERT INTO public.account_deletion_throttle (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Lê a coluna no próprio SELECT que trava: depois de esperar, ele enxerga o valor novo da linha. Uma
  -- subconsulta aqui continuaria com o valor de antes da espera.
  SELECT failed_password_at INTO v_attempts
  FROM public.account_deletion_throttle
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_recent := array(
    SELECT attempt FROM unnest(v_attempts) AS attempt
    WHERE attempt > now() - interval '15 minutes'
    ORDER BY attempt
  );

  IF cardinality(v_recent) >= 5 THEN
    RETURN false;
  END IF;

  UPDATE public.account_deletion_throttle
  SET failed_password_at = v_recent || now()
  WHERE user_id = p_user_id;

  RETURN true;
END;
$$;

-- Devolve a tentativa reservada quando ela não foi uma senha errada (a certa, ou o Auth fora do ar).
-- Tira só uma: a senha certa não apaga as erradas de antes.
CREATE FUNCTION public.release_account_deletion_password_attempt(p_user_id uuid)
RETURNS void
LANGUAGE sql
SET search_path = ''
AS $$
  UPDATE public.account_deletion_throttle
  SET failed_password_at = failed_password_at[1:cardinality(failed_password_at) - 1]
  WHERE user_id = p_user_id;
$$;

-- Reserva o próximo e-mail, no máximo um a cada 60 segundos. Num comando só, para pedidos simultâneos
-- não enviarem dois.
CREATE FUNCTION public.claim_account_deletion_email(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SET search_path = ''
AS $$
  WITH claimed AS (
    INSERT INTO public.account_deletion_throttle AS t (user_id, last_email_at)
    VALUES (p_user_id, now())
    ON CONFLICT (user_id) DO UPDATE
    SET last_email_at = now()
    WHERE t.last_email_at IS NULL OR t.last_email_at <= now() - interval '60 seconds'
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM claimed);
$$;

REVOKE ALL ON FUNCTION public.claim_account_deletion_password_attempt(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_account_deletion_password_attempt(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_account_deletion_email(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_account_deletion_password_attempt(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_account_deletion_password_attempt(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_account_deletion_email(uuid) TO service_role;
