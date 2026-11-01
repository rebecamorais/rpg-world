import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';

import { rpgWorldApi } from '@client';

import type { ConditionDto } from '@backend/contexts/conditions/domain/condition';

const NO_CONDITIONS: ConditionDto[] = [];

/** Every condition of both books, in the screen's language. The catalog never changes in a session. */
export function useConditions() {
  const locale = useLocale();
  const query = useQuery<ConditionDto[]>({
    queryKey: ['conditions', locale],
    queryFn: () => rpgWorldApi.get(`/api/conditions?locale=${encodeURIComponent(locale)}`),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });

  const list = query.data ?? NO_CONDITIONS;
  const byKey = useMemo(() => new Map(list.map((c) => [c.key, c])), [list]);

  return { byKey, list, isLoading: query.isLoading };
}
