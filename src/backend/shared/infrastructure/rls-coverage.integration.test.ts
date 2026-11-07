import { describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

type AdminWithHold = {
  schema(name: 'test_helpers'): {
    rpc(
      fn: 'run_and_hold',
      args: { p_sql: string; p_seconds: number },
    ): PromiseLike<{ error: { message: string } | null }>;
  };
};

// Reads the catalog instead of a list of tables, so a table added later is covered by itself.
const FAIL_ON_TABLE_WITHOUT_RLS = `
  DO $$
  DECLARE
    missing text;
  BEGIN
    SELECT string_agg(c.relname, ', ' ORDER BY c.relname) INTO missing
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND NOT c.relrowsecurity;

    IF missing IS NOT NULL THEN
      RAISE EXCEPTION 'Tabelas sem RLS: %', missing;
    END IF;
  END $$;
`;

describe('Cobertura de RLS (Integration)', () => {
  it('toda tabela do schema public tem RLS ligado', async () => {
    const { error } = await (SupabaseFactory.createAdmin() as unknown as AdminWithHold)
      .schema('test_helpers')
      .rpc('run_and_hold', { p_sql: FAIL_ON_TABLE_WITHOUT_RLS, p_seconds: 0 });

    expect(error?.message).toBeUndefined();
  });
});
