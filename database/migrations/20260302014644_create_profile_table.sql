-- 1. Criar a tabela de perfis (public.profile)

CREATE TABLE public.profile (
  -- FK vinculada ao motor de Auth do Supabase
  id         UUID         PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username   TEXT         UNIQUE,
  full_name  TEXT,
  avatar_url TEXT,
  
  -- Metadados de auditoria
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- Constraint para garantir username limpo (opcional, mas boa prática)
  CONSTRAINT username_length CHECK (username IS NULL OR char_length(username) >= 3)
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;

-- 3. Definir Policies
CREATE POLICY "profile_select_own" 
  ON public.profile FOR SELECT 
  USING ( (SELECT auth.uid()) = id );

CREATE POLICY "profile_update_own" 
  ON public.profile FOR UPDATE 
  USING ( (SELECT auth.uid()) = id );

-- 4. Trigger p Automático updated_at 
CREATE TRIGGER trg_profile_updated_at
  BEFORE UPDATE ON public.profile
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  
  
-- 5. Função pra sincronizar auth.users -> public.profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profile (id, username, avatar_url, full_name)
  VALUES (
    NEW.id, 
    LOWER(COALESCE(
      NEW.raw_user_meta_data->>'preferred_username', 
      split_part(NEW.email, '@', 1) || substring(NEW.id::text, 1, 5)
    )),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public;

-- 6. Trigger no schema AUTH
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();