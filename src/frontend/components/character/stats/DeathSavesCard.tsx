'use client';

import { useTranslations } from 'next-intl';

import { Card } from '@frontend/components/ui/card';
import { Hint } from '@frontend/components/ui/hint';
import { AppIcon } from '@frontend/components/ui/icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@frontend/components/ui/tooltip';
import { useCharacterActions, useLoadedCharacter } from '@frontend/context/CharacterContext';
import { setDeathSaves } from '@frontend/lib/character-sheet-updates';
import { cn } from '@frontend/lib/utils';

const MARKS = [0, 1, 2];

/** Death saves next to the hit points: what matters when the character is at 0 HP. */
export function DeathSavesCard() {
  const t = useTranslations('savingThrows');
  const { deathSaves } = useLoadedCharacter();
  const { update } = useCharacterActions();
  const successes = deathSaves?.successes ?? 0;
  const failures = deathSaves?.failures ?? 0;

  // Clicking the last marked circle unmarks it; any other sets the count up to it
  const next = (current: number, i: number) => (current === i + 1 ? i : i + 1);

  return (
    <Card className="bg-background/60 flex flex-col gap-3 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-label text-muted-foreground flex items-center gap-2">
          <Hint label={t('deathSaves')} hint={t('deathSavesHint')}>
            <AppIcon name="death-skull" variant="game" size="sm" aria-hidden="true" />
          </Hint>
          {t('deathSaves')}
        </h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={t('resetDeathSaves')}
              onClick={() => update(setDeathSaves(0, 0))}
              disabled={successes === 0 && failures === 0}
              className="text-muted-foreground hover:text-foreground focus-ring touch-target rounded-sm disabled:opacity-40"
            >
              <AppIcon name="RotateCcw" size={14} aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{t('resetDeathSaves')}</TooltipContent>
        </Tooltip>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-caption text-success-flare mb-2">{t('successes')}</legend>
          <div className="flex gap-3">
            {MARKS.map((i) => (
              <button
                key={i}
                type="button"
                aria-label={t('deathSaveSuccess', { count: i + 1 })}
                aria-pressed={successes > i}
                onClick={() => update(setDeathSaves(next(successes, i), failures))}
                className={cn(
                  'focus-ring touch-target h-5 w-5 rounded-full border-2 transition-colors',
                  successes > i
                    ? 'border-success bg-success shadow-[0_0_12px_var(--success-muted)]'
                    : 'border-success/60 hover:border-success',
                )}
              />
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-caption text-danger-flare mb-2">{t('failures')}</legend>
          <div className="flex gap-3">
            {MARKS.map((i) => (
              <button
                key={i}
                type="button"
                aria-label={t('deathSaveFailure', { count: i + 1 })}
                aria-pressed={failures > i}
                onClick={() => update(setDeathSaves(successes, next(failures, i)))}
                className={cn(
                  'focus-ring touch-target h-5 w-5 rounded-full border-2 transition-colors',
                  failures > i
                    ? 'border-danger bg-danger shadow-[0_0_12px_var(--danger-muted)]'
                    : 'border-danger/60 hover:border-danger',
                )}
              />
            ))}
          </div>
        </fieldset>
      </div>
    </Card>
  );
}
