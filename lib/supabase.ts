import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

import { Database } from './types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Validação apenas para o Admin (Service Role)
const validateAdminConfig = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.');
  }
};

/**
 * Factory para Clientes Supabase
 */
export const SupabaseFactory = {
  // O seu supabaseAdmin original, agora tipado e encapsulado
  createAdmin: () => {
    validateAdminConfig();
    return createClient<Database>(supabaseUrl!, serviceRoleKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  },

  // Cliente para o Browser/Server Components (Auth/Cookies)
  createClient: (cookieStore: ReadonlyRequestCookies) => {
    if (!supabaseUrl || !anonKey) throw new Error('Missing Anon Config');

    return createServerClient<Database>(supabaseUrl, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* Server Component context */
          }
        },
      },
    });
  },
};
