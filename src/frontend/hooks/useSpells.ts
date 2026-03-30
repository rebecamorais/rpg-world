import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';

import { rpgWorldApi } from '@client';

export type SpellDto = {
  id: string;
  name: string;
  level: number;
  school: string;
  classes: string[];
  components: string[];
  durationUnit?: string | null;
  durationValue?: number | null;
  rangeUnit?: string | null;
  rangeValue?: number | null;
  castingTime?: string | null;
  castingValue?: number | null;
};

export function useSpells() {
  const locale = useLocale();

  return useQuery<SpellDto[]>({
    queryKey: ['system-spells', locale],
    queryFn: async () => {
      return rpgWorldApi.get(`/api/spells?locale=${locale}`);
    },
  });
}
