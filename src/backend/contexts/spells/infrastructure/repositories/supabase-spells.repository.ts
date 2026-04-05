import { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@database-types';

import { FindSpellsParams, PaginatedSpells, SpellsRepo } from '../../domain/repository/spells.repo';

export class SupabaseSpellsRepository implements SpellsRepo {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findAll(params?: FindSpellsParams): Promise<PaginatedSpells> {
    const locale = params?.locale || 'en';
    const page = params?.page || 0;
    const limit = params?.limit || 12;
    const from = page * limit;
    const to = from + limit - 1;

    let query = this.client
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
        material_cost,
        is_scaling,
        damage_type,
        spell_category,
        bg_style_id,
        spell_translations!inner (
          name,
          description,
          higher_level,
          material
        )
      `,
        { count: 'exact' },
      )
      .eq('spell_translations.locale', locale);

    if (params?.search) {
      query = query.ilike('spell_translations.name', `%${params.search}%`);
    }

    if (params?.level !== undefined && params.level !== null) {
      query = query.eq('level', params.level);
    }

    if (params?.school) {
      query = query.eq('school', params.school);
    }

    if (params?.class) {
      query = query.contains('classes', [params.class]);
    }

    if (params?.damageType) {
      query = query.eq('damage_type', params.damageType);
    }

    const { data, count, error } = await query
      .order('level', { ascending: true })
      .order('id', { ascending: true }) // Stable sort for pagination
      .range(from, to);

    if (error) {
      console.error('Error fetching filtered spells:', error);
      return { data: [], total: 0 };
    }

    const mappedData = data.map((row) => ({
      id: row.id,
      name: row.spell_translations?.[0]?.name || row.id,
      description: row.spell_translations?.[0]?.description,
      higherLevel: row.spell_translations?.[0]?.higher_level,
      material: row.spell_translations?.[0]?.material,
      level: row.level,
      school: row.school || '',
      classes: row.classes || [],
      components: row.components || [],
      durationUnit: row.duration_unit,
      durationValue: row.duration_value,
      rangeUnit: row.range_unit,
      rangeValue: row.range_value,
      castingTime: row.casting_time,
      castingValue: row.casting_value,
      concentration: row.concentration ?? undefined,
      ritual: row.ritual ?? undefined,
      materialCost: row.material_cost ?? undefined,
      isScaling: row.is_scaling ?? undefined,
      damageType: row.damage_type || undefined,
      spellCategory: row.spell_category || undefined,
      bgStyleId: row.bg_style_id || undefined,
    }));

    return {
      data: mappedData,
      total: count || 0,
    };
  }
}
