-- Exclusão de conta: o pedido com o link de uso único, as perguntas que só o servidor pode fazer
-- sobre auth.users, e o feedback que fica só com o texto.

-- 1. O pedido. Só o hash do token fica aqui: quem lê o banco não consegue montar o link. Uma linha
-- por conta, então pedir de novo substitui o link anterior, e o pedido sai junto com a conta.
-- RLS ligado e sem política, sem grant para a chave pública nem para o usuário logado: quem tem um
-- link consegue excluir uma conta, então só o backend (service_role) toca nesta tabela.
CREATE TABLE public.account_deletion_requests (
  user_id     UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  token_hash  TEXT        UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.account_deletion_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.account_deletion_requests TO service_role;

-- 2. Se a conta tem senha. O servidor descobre sozinho, em vez de a tela perguntar: um "não tenho
-- senha" escolhido na tela deixaria qualquer um com a sessão aberta pular a conferência. O Auth
-- grava texto vazio em quem nunca teve senha, então NULL não basta.
--
-- SECURITY DEFINER porque o service_role não lê auth.users. Só o service_role executa.
CREATE FUNCTION public.auth_user_has_password(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = p_user_id AND coalesce(encrypted_password, '') <> ''
  );
$$;

REVOKE ALL ON FUNCTION public.auth_user_has_password(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_has_password(uuid) TO service_role;

-- 3. Se a conta ainda existe. O JWT é conferido localmente e continua válido por até uma hora depois
-- de a conta ser excluída; é esta busca pela chave primária que encerra a sessão antiga em outro
-- aparelho. Olha auth.users e não public.profile porque o callback de login ainda cria o perfil de
-- quem chega sem um, e essa pessoa não pode ser tratada como excluída.
CREATE FUNCTION public.auth_user_id_exists(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id);
$$;

REVOKE ALL ON FUNCTION public.auth_user_id_exists(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_id_exists(uuid) TO service_role;

-- 4. Feedback fica só com o texto, o tipo e a data. O ON DELETE SET NULL de feedback.user_id já
-- limpa o vínculo; o e-mail é limpo aqui, pelo user_id e pelo próprio e-mail, porque quem envia sem
-- estar logado não fica com user_id.
--
-- O gatilho é em auth.users, e não em public.profile: o BEFORE DELETE de profile já roda na cascata,
-- quando a linha de auth.users não existe mais e o e-mail não dá para ler. Assim vale também para
-- uma exclusão manual. SECURITY DEFINER porque quem apaga é o supabase_auth_admin, sem acesso a
-- public.feedback.
ALTER TABLE public.feedback ALTER COLUMN email DROP NOT NULL;

CREATE FUNCTION public.clear_feedback_email_of_deleted_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.feedback
  SET email = NULL
  WHERE user_id = OLD.id OR lower(email) = lower(OLD.email);
  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.clear_feedback_email_of_deleted_user() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER clear_feedback_email_before_user_delete
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.clear_feedback_email_of_deleted_user();
