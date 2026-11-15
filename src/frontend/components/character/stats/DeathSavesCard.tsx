'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { AppIcon } from '@frontend/components/ui/icon';
import { SectionCard } from '@frontend/components/ui/section-card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@frontend/components/ui/tooltip';
import { useCharacterActions, useLoadedCharacter } from '@frontend/context/CharacterContext';
import { setDeathSaves } from '@frontend/lib/character-sheet-updates';
import { cn } from '@frontend/lib/utils';

const MARKS = [0, 1, 2];

// saveNow already showed the error and put the server's marks back on screen
const ignore = () => {};

/**
 * Death saves next to the hit points: what matters when the character is at 0 HP. Each mark is
 * play, saved at once (closing the app mid-fight keeps it); clearing them has an Undo.
 */
export function DeathSavesCard() {
  const t = useTranslations('savingThrows');
  const { deathSaves } = useLoadedCharacter();
  const { saveNow } = useCharacterActions();
  const successes = deathSaves?.successes ?? 0;
  const failures = deathSaves?.failures ?? 0;

  // Clicking the last marked circle unmarks it; any other sets the count up to it
  const next = (current: number, i: number) => (current === i + 1 ? i : i + 1);

  const reset = async () => {
    const before = setDeathSaves(successes, failures);
    try {
      await saveNow(setDeathSaves(0, 0));
    } catch {
      return;
    }
    toast.success(t('deathSavesReset'), {
      action: { label: t('undo'), onClick: () => saveNow(before).catch(ignore) },
    });
  };

  return (
    <SectionCard>
      <SectionCard.Header>
        <SectionCard.Title icon="death-skull" iconVariant="game" hint={t('deathSavesHint')}>
          {t('deathSaves')}
        </SectionCard.Title>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={t('resetDeathSaves')}
              onClick={reset}
              disabled={successes === 0 && failures === 0}
              className="text-muted-foreground hover:text-foreground focus-ring touch-target rounded-sm disabled:opacity-40"
            >
              <AppIcon name="RotateCcw" size={14} aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{t('resetDeathSaves')}</TooltipContent>
        </Tooltip>
      </SectionCard.Header>

      <SectionCard.Body className="grid grid-cols-2 gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-caption text-success-flare mb-2">{t('successes')}</legend>
          <div className="flex gap-3">
            {MARKS.map((i) => (
              <button
                key={i}
                type="button"
                aria-label={t('deathSaveSuccess', { count: i + 1 })}
                aria-pressed={successes > i}
                onClick={() => saveNow(setDeathSaves(next(successes, i), failures)).catch(ignore)}
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
                onClick={() => saveNow(setDeathSaves(successes, next(failures, i))).catch(ignore)}
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
      </SectionCard.Body>
    </SectionCard>
  );
}
