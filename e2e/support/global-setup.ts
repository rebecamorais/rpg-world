import { adminClient } from './supabase';

// Spells from the official catalog (content files) that the specs use
export const SPELLS = {
  fireball: { id: 'dnd5e:srd-5.1:spell:fireball', name: 'Fireball' },
  shield: { id: 'dnd5e:srd-5.1:spell:shield', name: 'Shield' },
  light: { id: 'dnd5e:srd-5.1:spell:light', name: 'Light' },
};

type TruncatingClient = {
  schema(name: 'test_helpers'): {
    rpc(fn: 'truncate_all_tables'): Promise<{ error: { message: string } | null }>;
  };
};

/**
 * Starts every run from a clean test database. The spells come from the content files.
 * Shares the stack with the integration tests, so don't run both suites at the same time.
 */
export default async function globalSetup() {
  const admin = adminClient();

  const { error: truncateError } = await (admin as unknown as TruncatingClient)
    .schema('test_helpers')
    .rpc('truncate_all_tables');
  if (truncateError) throw new Error(`Failed to truncate tables: ${truncateError.message}`);
}
