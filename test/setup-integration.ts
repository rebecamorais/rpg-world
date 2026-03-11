import { beforeEach } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

type AdminWithTruncate = {
  rpc(fn: 'truncate_all_tables'): Promise<{ error: { message: string } | null }>;
};

beforeEach(async () => {
  // Types sao criados a partir do ambiente de teste, que nao possui o truncate_all_table por issoo tipo local
  const { error } = await (SupabaseFactory.createAdmin() as unknown as AdminWithTruncate).rpc(
    'truncate_all_tables',
  );
  if (error) {
    throw new Error(`Falha ao truncar tabelas: ${error?.message}`);
  }
});
