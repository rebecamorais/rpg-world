'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

import type { NpcFate } from '@backend/contexts/combat/domain/Encounter';
import type { ParticipantPatch } from '@backend/contexts/combat/domain/repository/combat.repo';

const MARKS = [1, 2, 3] as const;

/** Three toggles; marking the n-th sets the counter to n, and the highest one again unmarks it. */
function Marks({
  kind,
  count,
  onCount,
}: {
  kind: 'deathSuccess' | 'deathFailure';
  count: number;
  onCount: (count: number) => void;
}) {
  const t = useTranslations('combat');
  const failure = kind === 'deathFailure';
  return (
    // Bigger on touch: 36px marks 8px apart put the 44px targets edge to edge instead of overlapping
    <div className="flex items-center gap-1 pointer-coarse:gap-2">
      {MARKS.map((n) => {
        const pressed = n <= count;
        return (
          <button
            key={n}
            type="button"
            aria-label={t(kind, { n })}
            aria-pressed={pressed}
            onClick={() => onCount(n === count ? n - 1 : n)}
            className={cn(
              'focus-ring touch-target inline-flex size-6 items-center justify-center rounded-full border-2 transition-colors pointer-coarse:size-9',
              failure ? 'border-danger-flare' : 'border-success-flare',
              pressed && (failure ? 'bg-danger-flare' : 'bg-success-flare'),
            )}
          >
            {/* A glyph, not only the fill, tells marked from unmarked */}
            {pressed && (
              <AppIcon
                name={failure ? 'X' : 'Check'}
                size={14}
                aria-hidden="true"
                className="text-background"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * What the GM decides for an NPC at 0 HP: death saves or dead outright, then (once dead) whether
 * the players learn of it. The database drops the fate, the counters and the reveal by itself
 * when HP comes back, so each click sends only the one thing it changed.
 */
export function NpcFateControls({
  name,
  fate,
  deathSaves,
  revealed,
  onChange,
}: {
  name: string;
  fate: NpcFate | null;
  deathSaves: { successes: number; failures: number } | null;
  revealed: boolean;
  onChange: (patch: ParticipantPatch) => void;
}) {
  const t = useTranslations('combat');
  const saves = deathSaves ?? { successes: 0, failures: 0 };

  return (
    // Above the card's stretched link, so a click here neither navigates nor opens the card
    <div className="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-2">
      {fate === null && (
        <>
          <span className="text-caption text-muted-foreground">{t('chooseFate', { name })}</span>
          <Button variant="outline" size="sm" onClick={() => onChange({ fate: 'death_saves' })}>
            {t('fateDeathSaves')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onChange({ fate: 'dead' })}>
            {t('fateDead')}
          </Button>
        </>
      )}

      {fate === 'death_saves' && (
        <>
          <Marks
            kind="deathSuccess"
            count={saves.successes}
            onCount={(successes) => onChange({ deathSaves: { ...saves, successes } })}
          />
          <Marks
            kind="deathFailure"
            count={saves.failures}
            onCount={(failures) => onChange({ deathSaves: { ...saves, failures } })}
          />
          {saves.successes >= 3 && (
            <span className="text-label text-success-flare">{t('deathStable')}</span>
          )}
          <Button variant="outline" size="sm" onClick={() => onChange({ fate: 'dead' })}>
            {t('fateDead')}
          </Button>
        </>
      )}

      {fate === 'dead' && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange({ deathRevealed: !revealed })}
          >
            {revealed ? t('hideDeath') : t('revealDeath')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onChange({ fate: 'death_saves' })}>
            {t('undoDead')}
          </Button>
          {!revealed && (
            <span className="text-caption text-muted-foreground">{t('deathHiddenHint')}</span>
          )}
        </>
      )}
    </div>
  );
}
