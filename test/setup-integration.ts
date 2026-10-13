import { beforeEach } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

type AdminWithTruncate = {
  schema(name: 'test_helpers'): {
    rpc(fn: 'truncate_all_tables'): Promise<{ error: { message: string } | null }>;
  };
};

beforeEach(async () => {
  // truncate_all_tables vive no schema test_helpers (só existe no banco de teste), fora dos tipos gerados
  const { error } = await (SupabaseFactory.createAdmin() as unknown as AdminWithTruncate)
    .schema('test_helpers')
    .rpc('truncate_all_tables');
  if (error) {
    throw new Error(`Falha ao truncar tabelas: ${error?.message}`);
  }
});
