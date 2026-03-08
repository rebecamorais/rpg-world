DO $$
DECLARE
  user1_id UUID := gen_random_uuid();
  user2_id UUID := gen_random_uuid();
BEGIN
  -- Limpeza (Idempotência)
  DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email IN ('user-default@example.com', 'user-normal@example.com'));
  DELETE FROM auth.users WHERE email IN ('user-default@example.com', 'user-normal@example.com');

  -- Usuário 1
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, 
    confirmation_token, recovery_token, email_change_token_new, email_change, 
    phone, phone_change, phone_change_token, email_change_token_current
  )
  VALUES (
    user1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
    'user-default@example.com', crypt('123MudaASenha@', gen_salt('bf')), 
    now(), '{"provider":"email","providers":["email"]}', '{}', 
    now(), now(), 
    '', '', '', '', 
    NULL, '', '', ''  -- CORREÇÃO: Usar '' para tokens e phone_change para evitar erro de scan; NULL apenas para phone (UNIQUE)
  );

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), user1_id, 
    jsonb_build_object('snpub', user1_id, 'email', 'user-default@example.com'), 
    'email', user1_id, now(), now(), now()
  );

  -- Usuário 2
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, 
    confirmation_token, recovery_token, email_change_token_new, email_change, 
    phone, phone_change, phone_change_token, email_change_token_current
  )
  VALUES (
    user2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
    'user-normal@example.com', crypt('AnotherValidPassword123!', gen_salt('bf')), 
    now(), '{"provider":"email","providers":["email"]}', '{}', 
    now(), now(), 
    '', '', '', '', 
    NULL, '', '', ''  -- CORREÇÃO: Usar '' para tokens e phone_change para evitar erro de scan; NULL apenas para phone (UNIQUE)
  );

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), user2_id, 
    jsonb_build_object('sub', user2_id, 'email', 'user-normal@example.com'), 
    'email', user2_id, now(), now(), now()
  );
END $$;