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

export async function createUser(label: string, password = PASSWORD): Promise<TestUser> {
  const email = uniqueEmail(label);
  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error('createUser returned no user');
  return { id: data.user.id, email };
}
