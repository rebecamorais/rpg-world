-- Intervalo mínimo entre os e-mails de entrada de uma conta: link mágico, cadastro (o aviso de que a
-- conta já existe, ou uma nova confirmação) e nova senha. Esses links saem pela API admin e pelo
-- nosso SMTP, por fora do limite de e-mail do Auth, e o limite por IP do Auth vê só o IP do servidor.
-- Sem isto, cada envio do formulário vira um e-mail na caixa de alguém.
--
-- Uma linha por conta e por tipo, para um tipo não segurar o outro. Sai com a conta. Não serve o
-- account_deletion_throttle porque o last_email_at dele é o do pedido de exclusão. RLS ligado, sem
-- política, só o service_role.
CREATE TABLE public.auth_email_throttle (
  user_id      UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  kind         TEXT        NOT NULL CHECK (kind IN ('magiclink', 'signup', 'recovery')),
  last_sent_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (user_id, kind)
);

ALTER TABLE public.auth_email_throttle ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.auth_email_throttle FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.auth_email_throttle TO service_role;

-- Reserva o próximo e-mail do tipo para a conta do e-mail, no máximo um a cada 60 segundos. Devolve
-- false também quando o e-mail não tem conta: nos dois casos nada é enviado, e quem chama responde
-- igual. Num comando só, para pedidos simultâneos não enviarem dois. SECURITY DEFINER porque o
-- service_role não lê auth.users (como o auth_user_exists).
CREATE FUNCTION public.claim_auth_email(p_email text, p_kind text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH account AS (
    SELECT id FROM auth.users
    WHERE email = lower(trim(p_email)) AND is_sso_user = false
  ),
  claimed AS (
    INSERT INTO public.auth_email_throttle AS t (user_id, kind, last_sent_at)
    SELECT id, p_kind, now() FROM account
    ON CONFLICT (user_id, kind) DO UPDATE
    SET last_sent_at = now()
    WHERE t.last_sent_at <= now() - interval '60 seconds'
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM claimed);
$$;

-- Se a conta do e-mail já confirmou o endereço. O cadastro repetido de uma conta que nunca confirmou
-- manda uma confirmação nova, e não o aviso "entre com a sua senha", que não funcionaria.
CREATE FUNCTION public.auth_user_email_confirmed(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = lower(trim(p_email)) AND is_sso_user = false AND email_confirmed_at IS NOT NULL
  );
$$;

REVOKE ALL ON FUNCTION public.claim_auth_email(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auth_user_email_confirmed(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_auth_email(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.auth_user_email_confirmed(text) TO service_role;
