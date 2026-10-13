import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

import { SupabaseFactory } from '@lib/supabase';

const memoryCookieStore = (): ReadonlyRequestCookies => {
  const jar = new Map<string, string>();
  return {
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    getAll: () => Array.from(jar, ([name, value]) => ({ name, value })),
    set: (name: string, value: string) => jar.set(name, value),
  } as unknown as ReadonlyRequestCookies;
};

/**
 * Creates a confirmed user and returns a client signed in as them, the same kind of
 * user-scoped client the app uses per request. Queries through it are subject to RLS.
 */
export async function createSignedInClient(label: string) {
  const email = `${label}-${crypto.randomUUID()}@rls.test`;
  const password = 'RlsTestPass123!';

  const admin = SupabaseFactory.createAdmin();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error('createUser returned no user');

  const client = SupabaseFactory.createClient(memoryCookieStore());
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;

  return { client, userId: data.user.id };
}
