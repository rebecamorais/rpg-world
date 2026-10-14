import { adminClient } from './supabase';

// Spells the tests can search for; the IDs are fixed so specs can reference them
export const SPELLS = {
  fireball: { id: 'e2e00000-0000-4000-8000-000000000001', name: 'Fireball' },
  shield: { id: 'e2e00000-0000-4000-8000-000000000002', name: 'Shield' },
  light: { id: 'e2e00000-0000-4000-8000-000000000003', name: 'Light' },
};

type TruncatingClient = {
  schema(name: 'test_helpers'): {
    rpc(fn: 'truncate_all_tables'): Promise<{ error: { message: string } | null }>;
  };
};

/**
 * Starts every run from a clean test database with a known spell catalog.
 * Shares the stack with the integration tests, so don't run both suites at the same time.
 */
export default async function globalSetup() {
  const admin = adminClient();

  const { error: truncateError } = await (admin as unknown as TruncatingClient)
    .schema('test_helpers')
    .rpc('truncate_all_tables');
  if (truncateError) throw new Error(`Failed to truncate tables: ${truncateError.message}`);

  const { error: spellsError } = await admin.from('spells').insert([
    {
      id: SPELLS.fireball.id,
      external_index: 'fireball',
      level: 3,
      school: 'evocation',
      classes: ['wizard', 'sorcerer'],
      damage_type: 'fire',
      casting_time: 'action',
      casting_value: 1,
      range_unit: 'feet',
      range_value: 150,
      duration_unit: 'instantaneous',
      components: ['V', 'S', 'M'],
    },
    {
      id: SPELLS.shield.id,
      external_index: 'shield',
      level: 1,
      school: 'abjuration',
      classes: ['wizard', 'sorcerer'],
      casting_time: 'reaction',
      casting_value: 1,
      range_unit: 'self',
      duration_unit: 'round',
      duration_value: 1,
      components: ['V', 'S'],
    },
    {
      id: SPELLS.light.id,
      external_index: 'light',
      level: 0,
      school: 'evocation',
      classes: ['wizard', 'cleric'],
      casting_time: 'action',
      casting_value: 1,
      range_unit: 'touch',
      duration_unit: 'hour',
      duration_value: 1,
      components: ['V', 'M'],
    },
  ]);
  if (spellsError) throw new Error(`Failed to seed spells: ${spellsError.message}`);

  const { error: translationsError } = await admin.from('spell_translations').insert(
    Object.values(SPELLS).map((spell) => ({
      spell_id: spell.id,
      locale: 'en',
      name: spell.name,
      description: `${spell.name} description.`,
    })),
  );
  if (translationsError) {
    throw new Error(`Failed to seed spell translations: ${translationsError.message}`);
  }
}
