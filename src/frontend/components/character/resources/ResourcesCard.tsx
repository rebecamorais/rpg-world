'use client';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { UsePips } from '@frontend/components/character/stats/UsePips';
import { Card } from '@frontend/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@frontend/components/ui/popover';
import { useCharacterActions, useLoadedCharacter } from '@frontend/context/CharacterContext';
import { useSheetSource } from '@frontend/hooks/useSheetSource';
import { setResourceUsed } from '@frontend/lib/character-sheet-updates';

import { recoveryOn } from '@shared/systems/dnd5e/class-resources';
import type { ResourceBox } from '@shared/systems/dnd5e/class-resources';

const RESTS = ['short', 'long'] as const;

/** The class resources (Rage, Ki…) with their uses, next to the death saves. */
export function ResourcesCard({ boxes }: { boxes: ResourceBox[] }) {
  const t = useTranslations('classResources');
  const character = useLoadedCharacter();
  const { saveNow } = useCharacterActions();
  const { readOnly, pagesPath } = useSheetSource(character.id);

  return (
    <Card id="sheet-resources" className="bg-background/60 flex flex-col gap-3 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-label text-muted-foreground">{t('title')}</h2>
        {!readOnly && (
          <Link
            href={`${pagesPath}/appearance#class-resources`}
            className="text-caption text-character-flare focus-ring rounded-sm underline"
          >
            {t('edit')}
          </Link>
        )}
      </div>

      <ul className="flex flex-col gap-3">
        {boxes.map((box) => (
          <li key={box.key} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="focus-ring text-sm font-semibold underline decoration-dotted underline-offset-4"
                  >
                    {box.name}
                  </button>
                </PopoverTrigger>
                <PopoverContent>
                  <p className="font-semibold">{box.name}</p>
                  <p className="text-muted-foreground">{box.description}</p>
                  {box.note && <p className="text-muted-foreground mt-2 italic">{box.note}</p>}
                </PopoverContent>
              </Popover>
              {box.die && (
                <span className="text-muted-foreground font-mono text-xs">d{box.die}</span>
              )}
              {RESTS.map((rest) =>
                recoveryOn(box, rest) === null ? null : (
                  <span
                    key={rest}
                    className="text-caption border-character-muted text-muted-foreground rounded-sm border px-1.5"
                  >
                    {t(rest)}
                  </span>
                ),
              )}
            </div>
            <UsePips
              label={box.name}
              max={box.max}
              used={box.used}
              asNumber={box.unit === 'hit-points'}
              disabled={readOnly}
              onChange={(used) => {
                const patch = setResourceUsed(box.key, used);
                return saveNow(typeof patch === 'function' ? patch(character) : patch);
              }}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}
