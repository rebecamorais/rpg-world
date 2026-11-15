import { queryOptions, useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';

import { rpgWorldApi } from '@client';

import type { ClassContent } from '@shared/systems/dnd5e/class-resources';
import type { Edition } from '@shared/systems/dnd5e/content/editions';

/** The query for one class's resources; shared so the edition card can load them before saving. */
export const classResourcesQuery = (
  edition: Edition | undefined,
  classId: string | null,
  locale: string,
) =>
  queryOptions<ClassContent>({
    queryKey: ['class-resources', edition, classId, locale],
    queryFn: () =>
      rpgWorldApi.get(
        `/api/content/classes?edition=${edition}&class=${encodeURIComponent(classId ?? '')}&locale=${encodeURIComponent(locale)}`,
      ),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: false,
  });

/** One class and its SRD subclass, in the screen's language: resources and rules data. Never changes in a session. */
export function useClassResources(edition: Edition | undefined, classId: string | null) {
  const locale = useLocale();
  const query = useQuery({
    ...classResourcesQuery(edition, classId, locale),
    enabled: Boolean(edition && classId),
  });

  return { content: query.data ?? null };
}
