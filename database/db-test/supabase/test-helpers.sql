-- Seeds exclusivos do ambiente de TESTE — nunca aplicados em produção.
-- Aplicados automaticamente pelo `supabase db reset --workdir database/db-test`.

-- Função para truncar todos os dados entre testes (muito mais rápido que db reset).
-- Roda como SECURITY DEFINER para acessar auth.users sem precisar de superuser no caller.
CREATE OR REPLACE FUNCTION public.truncate_all_tables()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Limpa todas as tabelas do schema PUBLIC (dados da aplicação)
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'schema_migrations') LOOP
        EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
    END LOOP;

    -- 2. Remove usuários do Auth via DELETE (evita problema de ownership em sequences do auth)
    --    O CASCADE elimina identidades, sessões e fatores de MFA via FK
    DELETE FROM auth.users WHERE true;
END;
$$;

-- Segurança: apenas o service_role (usado pelo Vitest) pode chamar esta função
REVOKE ALL ON FUNCTION public.truncate_all_tables() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.truncate_all_tables() TO service_role;
