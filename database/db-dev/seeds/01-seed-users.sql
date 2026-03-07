DO $$
DECLARE
  user1_id UUID := gen_random_uuid();
  user2_id UUID := gen_random_uuid();
BEGIN
  -- Insert user 1
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    user1_id,
    'authenticated',
    'authenticated',
    'user-default@example.com',
    crypt('123MudaASenha@', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    now(),
    now()
  );

  -- ADICIONADO: provider_id
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), -- ID da identidade (pode ser um novo UUID)
    user1_id,
    format('{"sub":"%s","email":"%s"}', user1_id, 'user-default@example.com')::jsonb,
    'email',
    user1_id, -- provider_id mapeado para o UUID do user
    now(),
    now(),
    now()
  );

  -- Insert user 2
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    user2_id,
    'authenticated',
    'authenticated',
    'user-normal@example.com',
    crypt('AnotherValidPassword123!', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    now(),
    now()
  );

  -- ADICIONADO: provider_id
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    user2_id,
    format('{"sub":"%s","email":"%s"}', user2_id, 'user-normal@example.com')::jsonb,
    'email',
    user2_id,
    now(),
    now(),
    now()
  );
END $$;