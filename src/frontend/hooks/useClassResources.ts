import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';

import { rpgWorldApi } from '@client';

import type { ClassResourcesContent } from '@shared/systems/dnd5e/class-resources';
import type { Edition } from '@shared/systems/dnd5e/content/editions';

/** The resources of one class and its SRD subclass, in the screen's language. Never changes in a session. */
export function useClassResources(edition: Edition | undefined, classId: string | null) {
  const locale = useLocale();
  const query = useQuery<ClassResourcesContent>({
    queryKey: ['class-resources', edition, classId, locale],
    queryFn: () =>
      rpgWorldApi.get(
        `/api/content/classes?edition=${edition}&class=${encodeURIComponent(classId ?? '')}&locale=${encodeURIComponent(locale)}`,
      ),
    enabled: Boolean(edition && classId),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: false,
  });

  return { content: query.data ?? null, isLoading: query.isLoading };
}
