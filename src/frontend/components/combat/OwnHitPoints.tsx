'use client';

import { useEffect, useMemo, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { AdjustHitPoints } from '@frontend/components/character/stats/AdjustHitPoints';
import { Button } from '@frontend/components/ui/button';
import { HealthBar } from '@frontend/components/ui/health-bar';
import { AppIcon } from '@frontend/components/ui/icon';
import { CharacterProvider, useCharacterState } from '@frontend/context/CharacterContext';
import { type SheetSource, SheetSourceContext } from '@frontend/hooks/useSheetSource';
import { encounterQueryKey } from '@frontend/lib/query-keys';
import { cn } from '@frontend/lib/utils';

import type { OwnVitals } from '@backend/contexts/combat/domain/Encounter';

type Hp = OwnVitals['hp'];

/**
 * A player's own HP in the combat, as the GM's row shows it: "12 / 20 +3" over the bar. `lg` is
 * the "your turn" card's; the default fits beside a name, in the list or the turn bar.
 */
export function OwnHp({
  hp,
  size = 'sm',
  className,
}: {
  hp: Hp;
  size?: 'sm' | 'lg';
  className?: string;
}) {
  const t = useTranslations('combat');
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <span
        className={cn(
          'text-foreground font-mono font-bold tabular-nums',
          size === 'lg' ? 'text-2xl' : 'self-end text-sm',
        )}
      >
        {/* Without it a screen reader only says "12 / 20" */}
        <span className="sr-only">{t('hp')} </span>
        {hp.current}
        <span className={cn('text-muted-foreground', size === 'lg' && 'text-base')}>
          {' '}
          / {hp.max}
        </span>
        {hp.temp > 0 && (
          <span className={cn('text-warning-flare', size === 'lg' && 'text-base')}>
            {' '}
            +{hp.temp}
            <span className="sr-only"> {t('tempHp')}</span>
          </span>
        )}
      </span>
      <HealthBar current={hp.current} max={hp.max} temp={hp.temp} aria-hidden="true" />
    </div>
  );
}

/**
 * The player's own sheet, editable, wherever the combat sits (the party's route would otherwise
 * read it as the GM's read-only view). Only what "Adjust HP" needs reads it.
 */
const ownSheetSource = (characterId: string): SheetSource => ({
  readOnly: false,
  partyId: null,
  apiPath: `/api/characters/${characterId}`,
  pagesPath: `/system/DnD_5e/character/${characterId}`,
  embedded: true,
});

function AdjustTrigger({
  name,
  hp,
  partyId,
  compact,
}: {
  name: string;
  hp: Hp;
  partyId: string;
  compact: boolean;
}) {
  const tStats = useTranslations('combatStats');
  const queryClient = useQueryClient();
  const { character } = useCharacterState();
  const id = character?.id ?? null;

  // The combat's numbers changed (a save here, on the sheet's tab or on another device): the
  // sheet behind "Adjust HP" reads them again, so damage applies to the HP on screen
  const shown = `${hp.current}/${hp.max}/${hp.temp}`;
  const seen = useRef(shown);
  useEffect(() => {
    if (!id || seen.current === shown) return;
    seen.current = shown;
    void queryClient.invalidateQueries({ queryKey: ['character', id] });
  }, [queryClient, id, shown]);

  const button = (
    <Button
      variant="outline"
      size={compact ? 'sm' : 'default'}
      className={cn('shrink-0', compact ? 'touch-target' : 'h-11')}
      disabled={!character}
      // Starts with the visible words; the name tells apart the buttons of several characters
      aria-label={`${tStats('adjustHp')} ${name}`}
    >
      <AppIcon name="Heart" size={16} aria-hidden="true" />
      {tStats('adjustHp')}
    </Button>
  );
  if (!character) return button;

  return (
    <AdjustHitPoints
      // Shown at once: the combat reads the sheet again instead of waiting for the broadcast
      onSaved={() => void queryClient.invalidateQueries({ queryKey: encounterQueryKey(partyId) })}
    >
      {button}
    </AdjustHitPoints>
  );
}

/**
 * "Adjust HP" for a player's own character in the combat: the sheet's own dialog, saved to the
 * sheet like there; the combat follows, as it does for any save of the sheet.
 */
export function AdjustOwnHitPoints({
  partyId,
  characterId,
  name,
  hp,
  compact = false,
}: {
  partyId: string;
  characterId: string;
  name: string;
  hp: Hp;
  /** A small button among the row's others; the default is the "your turn" card's, 44px tall. */
  compact?: boolean;
}) {
  const source = useMemo(() => ownSheetSource(characterId), [characterId]);
  return (
    <SheetSourceContext.Provider value={source}>
      <CharacterProvider characterId={characterId}>
        <AdjustTrigger name={name} hp={hp} partyId={partyId} compact={compact} />
      </CharacterProvider>
    </SheetSourceContext.Provider>
  );
}
