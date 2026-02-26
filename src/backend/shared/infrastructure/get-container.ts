import { cache } from 'react';

import { cookies } from 'next/headers';

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import 'server-only';

import { Container } from './container';

/**
 * Request-Scoped Container
 * Using React cache() to memoize the container instance per-request.
 * This prevents state leakage across different user requests in a Serverless environment.
 */
export const getContainer = cache(async () => {
  const cookieStore = await cookies();

  // The Auth Client is specific to the current user's request (tied to their cookies)
  const authClient = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            console.log('error from Server Component ignored', error);
            // Ignore errors when called from Server Components during render phase
          }
        },
      },
    },
  );

  // The DB Client is an administrative (Service Role) client
  const dbClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  return new Container(authClient, dbClient);
});
