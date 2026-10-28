import { createClient } from '@supabase/supabase-js';

import { supabaseTestEnv } from './env';

export const PASSWORD = 'E2ePassword123!';

export interface TestUser {
  id: string;
  email: string;
}

/** Service-role client for test setup only; the app under test never sees it. */
export function adminClient() {
  const { url, secretKey } = supabaseTestEnv();
  return createClient(url, secretKey, { auth: { persistSession: false } });
}

export const uniqueEmail = (label: string) => `${label}-${crypto.randomUUID()}@e2e.test`;

/**
 * A confirmed user. By default their username counts as chosen, like any account past onboarding;
 * `usernameChosen: false` keeps the generated placeholder, so the app asks for one first.
 */
export async function createUser(
  label: string,
  password = PASSWORD,
  { usernameChosen = true }: { usernameChosen?: boolean } = {},
): Promise<TestUser> {
  const email = uniqueEmail(label);
  const admin = adminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error('createUser returned no user');
  if (usernameChosen) {
    const { error: profileError } = await admin
      .from('profile')
      .update({ username_chosen: true })
      .eq('id', data.user.id);
    if (profileError) throw profileError;
  }
  return { id: data.user.id, email };
}
