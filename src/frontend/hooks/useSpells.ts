import { useEffect } from 'react';

import { keepPreviousData, queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';

import { rpgWorldApi } from '@client';

import { CharacterClass, Spell, SpellSchool } from '@frontend/types/spells';

import type { Edition } from '@shared/systems/dnd5e/content/editions';

type SpellDto = Spell;

type PaginatedSpells = {
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
  edition?: Edition | null;
};

const DEFAULT_LIMIT = 12;

function spellsQuery(locale: string, filters: UseSpellsFilters) {
  return queryOptions<PaginatedSpells>({
    queryKey: ['system-spells', locale, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        locale,
        page: (filters.page || 0).toString(),
        limit: (filters.limit || DEFAULT_LIMIT).toString(),
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.level !== undefined && filters.level !== null) {
        params.append('level', filters.level.toString());
      }
      if (filters.school) params.append('school', filters.school);
      if (filters.class) params.append('class', filters.class);
      if (filters.damageType) params.append('damageType', filters.damageType);
      if (filters.edition) params.append('edition', filters.edition);

      return rpgWorldApi.get(`/api/spells?${params.toString()}`);
    },
    // The spell catalog doesn't change during a session: reopening the search or going back
    // to a page uses what was already fetched
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });
}

export function useSpells(filters: UseSpellsFilters = {}) {
  const locale = useLocale();
  const queryClient = useQueryClient();

  const query = useQuery({
    ...spellsQuery(locale, filters),
    // Paging and filtering keep the current list on screen until the next one arrives
    placeholderData: keepPreviousData,
  });

  // Fetch the next page ahead, so "next" shows it right away
  const total = query.isPlaceholderData ? undefined : query.data?.total;
  const filtersKey = JSON.stringify(filters);
  useEffect(() => {
    if (total === undefined) return;
    const current: UseSpellsFilters = JSON.parse(filtersKey);
    const nextPage = (current.page || 0) + 1;
    if (nextPage * (current.limit || DEFAULT_LIMIT) >= total) return;
    void queryClient.prefetchQuery(spellsQuery(locale, { ...current, page: nextPage }));
  }, [total, filtersKey, locale, queryClient]);

  return query;
}
