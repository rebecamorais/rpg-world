import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';

import { rpgWorldApi } from '@client';

import { CharacterClass, Spell, SpellSchool } from '@frontend/types/spells';

export type SpellDto = Spell;

export type PaginatedSpells = {
  data: SpellDto[];
  total: number;
};

export type UseSpellsFilters = {
  page?: number;
  limit?: number;
  search?: string;
  level?: number | null;
  school?: SpellSchool | string | null;
  class?: CharacterClass | string | null;
  damageType?: string | null;
};

export function useSpells(filters: UseSpellsFilters = {}) {
  const locale = useLocale();

  return useQuery<PaginatedSpells>({
    queryKey: ['system-spells', locale, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        locale,
        page: (filters.page || 0).toString(),
        limit: (filters.limit || 12).toString(),
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.level !== undefined && filters.level !== null) {
        params.append('level', filters.level.toString());
      }
      if (filters.school) params.append('school', filters.school);
      if (filters.class) params.append('class', filters.class);
      if (filters.damageType) params.append('damageType', filters.damageType);

      return rpgWorldApi.get(`/api/spells?${params.toString()}`);
    },
  });
}
