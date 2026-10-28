-- Username obrigatório, único sem diferenciar maiúsculas, e com a marca de "escolhido".
--
-- Até aqui o cadastro gerava o username a partir do e-mail (prefixo + 5 caracteres do id), o que
-- expõe o e-mail e pode ter caracteres que o app recusa. Agora:
-- - o gerado é palavras aleatórias + 4 dígitos (ex.: corvo_dourado_4821) e só serve de
--   placeholder: username_chosen = false até a pessoa escolher o seu (o app pede no próximo acesso
--   e não mostra o gerado para ninguém);
-- - contas atuais: quem tem o username no padrão do e-mail fica com ele, mas não escolhido; quem
--   tem outro é tratado como escolhido; só os nulos ganham um nome aleatório.

-- 1. Gerador de username: substantivo_adjetivo_dddd, ASCII minúsculo, único na hora da geração.
--    É o DEFAULT da coluna, e o fallback de login cria o perfil com o client do próprio usuário:
--    roda como SECURITY DEFINER para enxergar todos os usernames na checagem de unicidade (com o
--    RLS do usuário ele só veria o próprio). Fica no schema private, que a API não expõe, então
--    ninguém o chama por RPC; quem insere perfil recebe só USAGE + EXECUTE para o DEFAULT rodar.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

CREATE FUNCTION private.random_username()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  nouns text[] := ARRAY['corvo','dragao','lobo','grifo','fenix','golem','elfo','anao','bardo',
    'mago','ranger','druida','paladino','ladino','monge','bruxo','clerigo','barbaro','goblin',
    'kobold','orc','troll','hidra','quimera','esfinge','basilisco','wyvern','unicornio','pegaso',
    'centauro'];
  adjectives text[] := ARRAY['dourado','sombrio','valente','sabio','veloz','astuto','silencioso',
    'ardente','gelido','antigo','errante','sereno','feroz','arcano','rubro','prateado','noturno',
    'radiante','selvagem','leal','curioso','bravo','sutil','nobre','rustico','mistico','alado',
    'distante','tranquilo','audaz'];
  candidate text;
BEGIN
  LOOP
    candidate := nouns[1 + floor(random() * array_length(nouns, 1))::int]
      || '_' || adjectives[1 + floor(random() * array_length(adjectives, 1))::int]
      || '_' || lpad(floor(random() * 10000)::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.profile WHERE lower(username) = candidate
    );
  END LOOP;
  RETURN candidate;
END;
$$;

REVOKE ALL ON FUNCTION private.random_username() FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.random_username() TO authenticated, service_role;

-- 2. Marca de "escolhido"
ALTER TABLE public.profile ADD COLUMN username_chosen boolean NOT NULL DEFAULT false;

-- 3. Quem tem um username fora do padrão gerado pelo e-mail escolheu o seu
UPDATE public.profile AS p
SET username_chosen = true
FROM auth.users AS u
WHERE u.id = p.id
  AND p.username IS NOT NULL
  AND p.username <> lower(split_part(u.email, '@', 1) || substring(u.id::text, 1, 5));

-- 4. Só os nulos ganham um nome aleatório (os gerados pelo e-mail ficam, não escolhidos)
UPDATE public.profile SET username = private.random_username() WHERE username IS NULL;

-- 4b. Usernames que só diferem por maiúsculas (Bia × bia): o mais antigo fica com o nome; os outros
--     ganham um aleatório e voltam a "não escolhido" (escolhem de novo no próximo acesso)
UPDATE public.profile AS p
SET username = private.random_username(), username_chosen = false
FROM (
  SELECT id, row_number() OVER (PARTITION BY lower(username) ORDER BY created_at, id) AS position
  FROM public.profile
) AS ranked
WHERE ranked.id = p.id AND ranked.position > 1;

-- 5. Obrigatório e único sem diferenciar maiúsculas
ALTER TABLE public.profile
  ALTER COLUMN username SET DEFAULT private.random_username(),
  ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX profile_username_lower_key ON public.profile (lower(username));

-- 6. O cadastro não informa mais o username: o DEFAULT gera, sem e-mail nem preferred_username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profile (id, avatar_url, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
