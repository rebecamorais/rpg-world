import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';

import { rpgWorldApi } from '@client';

import type { ItemDto } from '@backend/contexts/items/domain/item';

const NO_ITEMS: ItemDto[] = [];

/** Every common item of both books, in the screen's language. The catalog never changes in a session. */
export function useItems() {
  const locale = useLocale();
  const query = useQuery<ItemDto[]>({
    queryKey: ['items', locale],
    queryFn: () => rpgWorldApi.get(`/api/items?locale=${encodeURIComponent(locale)}`),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });

  const list = query.data ?? NO_ITEMS;
  const byKey = useMemo(() => new Map(list.map((i) => [i.key, i])), [list]);

  return { byKey, list, isLoading: query.isLoading };
}
