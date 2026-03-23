import { createBrowserClient } from '@supabase/ssr';

import { Database } from '@database-types';

let supabaseBrowserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export const getSupabaseBrowserClient = () => {
  if (supabaseBrowserClient) return supabaseBrowserClient;

  supabaseBrowserClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  return supabaseBrowserClient;
};
