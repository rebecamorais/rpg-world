'use client';

import { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { Card } from '@frontend/components/ui/card';
import { useCharacterActions } from '@frontend/context/CharacterContext';
import { classResourcesQuery } from '@frontend/hooks/useClassResources';

import { EDITIONS, type Edition } from '@shared/systems/dnd5e/content/editions';

/** Offered to sheets of a listed class with no edition yet: choosing one unlocks its resources. */
export function EditionCard({ classId }: { classId: string }) {
  const t = useTranslations('classResources');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { saveNow } = useCharacterActions();
  const [pending, setPending] = useState<Edition | null>(null);

  const choose = async (edition: Edition) => {
    setPending(edition);
    try {
      // The boxes load first: saved before them, the row would vanish until the catalog arrived
      await queryClient.prefetchQuery(classResourcesQuery(edition, classId, locale));
      await saveNow({ edition });
    } catch {
      // saveNow already showed the error; the card stays to try again
    } finally {
      setPending(null);
    }
  };

  return (
    <Card className="bg-background/60 flex flex-col gap-3 p-4 shadow-sm" aria-busy={!!pending}>
      <h2 className="text-label text-muted-foreground">{t('newTitle')}</h2>
      <p className="text-sm">{t('newText')}</p>
      <div className="flex gap-2">
        {EDITIONS.map((edition) => (
          <Button
            key={edition}
            variant="outline"
            size="sm"
            disabled={pending !== null}
            loading={pending === edition}
            onClick={() => choose(edition)}
          >
            {edition}
          </Button>
        ))}
      </div>
    </Card>
  );
}
