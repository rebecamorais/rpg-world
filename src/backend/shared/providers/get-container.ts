import { cache } from 'react';

import { cookies } from 'next/headers';

import 'server-only';

import { SupabaseFactory } from '@lib/supabase';

import { Container } from './container';

/**
 * Request-Scoped Container
 * Using React cache() to memoize the container instance per-request.
 * This prevents state leakage across different user requests in a Serverless environment.
 */
export const getContainer = cache(async () => {
  const cookieStore = await cookies();

  const adminClient = SupabaseFactory.createAdmin();

  const authClient = SupabaseFactory.createClient(cookieStore);

  return new Container(authClient, adminClient);
});
