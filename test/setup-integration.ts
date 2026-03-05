import { beforeEach } from 'vitest';

import { supabaseAdmin } from '../src/lib/supabase-admin';

beforeEach(async () => {
  const { error } = await supabaseAdmin.rpc('truncate_all_tables');
  if (error) {
    throw new Error(`Falha ao truncar tabelas: ${error.message}`);
  }
});
