import { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@database-types';

import { SpellDto, SpellsRepo } from '../../domain/repository/spells.repo';

export class SupabaseSpellsRepository implements SpellsRepo {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findAll(locale: string = 'en'): Promise<SpellDto[]> {
    const { data, error } = await this.client
      .from('spells')
      .select(
        `
        id,
        level,
        school,
        classes,
        components,
        duration_unit,
        duration_value,
        range_unit,
        range_value,
        casting_time,
        casting_value,
        concentration,
        ritual,
        components,
        material_cost,
        is_scaling,
        spell_translations (
          name
        )
      `,
      )
      .eq('spell_translations.locale', locale);

    if (error) {
      console.error('Error fetching all spells:', error);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((row) => ({
      id: row.id,
      name: row.spell_translations?.[0]?.name || row.id,
      level: row.level,
      school: row.school,
      classes: row.classes || [],
      components: row.components || [],
      durationUnit: row.duration_unit,
      durationValue: row.duration_value,
      rangeUnit: row.range_unit,
      rangeValue: row.range_value,
      castingTime: row.casting_time,
      castingValue: row.casting_value,
      concentration: row.concentration,
      ritual: row.ritual,
      materialCost: row.material_cost,
      isScaling: row.is_scaling,
    }));
  }
}
