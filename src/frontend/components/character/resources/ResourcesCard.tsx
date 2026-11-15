'use client';

import { useTranslations } from 'next-intl';

import { UsePips } from '@frontend/components/character/stats/UsePips';
import { RulesBlocks } from '@frontend/components/content/RulesBlocks';
import { Card } from '@frontend/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@frontend/components/ui/popover';
import { useCharacterActions, useLoadedCharacter } from '@frontend/context/CharacterContext';
import AppLink from '@frontend/demo/AppLink';
import { useSheetSource } from '@frontend/hooks/useSheetSource';
import { setResourceUsed } from '@frontend/lib/character-sheet-updates';
import { characterTheme } from '@frontend/lib/color-utils';
import { cn } from '@frontend/lib/utils';

import { recoveryOn } from '@shared/systems/dnd5e/class-resources';
import type { ResourceBox } from '@shared/systems/dnd5e/class-resources';
import { editionSource } from '@shared/systems/dnd5e/content/editions';

const RESTS = ['short', 'long'] as const;

/** The class resources (Rage, Ki…) with their uses, next to the death saves. */
export function ResourcesCard({ boxes }: { boxes: ResourceBox[] }) {
  const t = useTranslations('classResources');
  const character = useLoadedCharacter();
  const { saveNow } = useCharacterActions();
  const { readOnly, pagesPath } = useSheetSource(character.id, character.system);
  // The book the rules texts come from, for the condition links in them
  const source = editionSource(character.edition);

  // Shown at once and saved in the background, one save after the other (see saveNow)
  const spend = (key: string, used: number) => saveNow(setResourceUsed(key, used));

  return (
    <Card id="sheet-resources" className="bg-background/60 flex flex-col gap-3 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-label text-muted-foreground">{t('title')}</h2>
        {!readOnly && (
          <AppLink
            href={`${pagesPath}/appearance#class-resources`}
            className="text-caption text-character-flare focus-ring inline-flex items-center justify-center rounded-sm underline pointer-coarse:min-h-11 pointer-coarse:min-w-11"
          >
            {t('edit')}
          </AppLink>
        )}
      </div>

      <ul className="flex flex-col gap-3">
        {boxes.map((box, index) => (
          <li
            key={box.key}
            // A box with a color of its own re-themes its row: the tags and squares follow it
            style={box.color ? characterTheme(box.color).style : undefined}
            className={cn(
              'flex flex-wrap items-center justify-between gap-x-3 gap-y-1',
              box.color && characterTheme(box.color).className,
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  {/* Not a <button>: the read-only sheet's disabled fieldset would turn it off,
                      and the rule's text is there to be read */}
                  <span
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') return;
                      event.preventDefault();
                      event.currentTarget.click();
                    }}
                    className="focus-ring inline-flex cursor-pointer items-center text-sm font-semibold underline decoration-dotted underline-offset-4 pointer-coarse:min-h-11"
                  >
                    {box.name}
                  </span>
                </PopoverTrigger>
                <PopoverContent>
                  <p className="font-semibold">{box.name}</p>
                  {box.description && (
                    <div className="text-muted-foreground">
                      <RulesBlocks text={box.description} source={source} />
                    </div>
                  )}
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
              data-rest-focus={index === 0}
              onChange={(used) => spend(box.key, used)}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}
