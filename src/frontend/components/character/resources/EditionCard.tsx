'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { Card } from '@frontend/components/ui/card';
import { useCharacterActions } from '@frontend/context/CharacterContext';

import { EDITIONS } from '@shared/systems/dnd5e/content/editions';

/** Offered to sheets with no edition yet: choosing one unlocks the class resources. */
export function EditionCard() {
  const t = useTranslations('classResources');
  const { saveNow } = useCharacterActions();

  return (
    <Card className="bg-background/60 flex flex-col gap-3 p-4 shadow-sm">
      <h2 className="text-label text-muted-foreground">{t('newTitle')}</h2>
      <p className="text-sm">{t('newText')}</p>
      <div className="flex gap-2">
        {EDITIONS.map((edition) => (
          <Button key={edition} variant="outline" size="sm" onClick={() => saveNow({ edition })}>
            {edition}
          </Button>
        ))}
      </div>
    </Card>
  );
}
