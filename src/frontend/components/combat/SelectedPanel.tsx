'use client';

import type { CSSProperties } from 'react';

import { useTranslations } from 'next-intl';

import { CharacterPortrait } from '@frontend/components/character/CharacterPortrait';
import { HealthBar } from '@frontend/components/ui/health-bar';
import { characterTheme } from '@frontend/lib/color-utils';
import { cn } from '@frontend/lib/utils';

import type { ActiveCondition, GmRow } from '@backend/contexts/combat/domain/Encounter';
import type { ParticipantPatch } from '@backend/contexts/combat/domain/repository/combat.repo';

import type { Edition } from '@shared/systems/dnd5e/content/editions';

import { sheetHrefOf } from './CombatRow';
import { CombatRowDetails } from './CombatRowDetails';
import { OwnerOrSideBadge } from './SideBadge';

/**
 * Larger screens: the participant picked in the list (the one whose turn it is, until the GM
 * picks another), with every edit a row has when opened on a phone. Stays in view while the list
 * scrolls.
 */
export function SelectedPanel({
  partyId,
  row,
  edition,
  swapWith,
  onSwap,
  onChange,
  onRemove,
  onConditionsChange,
}: {
  partyId: string;
  row: GmRow;
  edition: Edition;
  swapWith: { participantId: string; name: string }[];
  onSwap: (participantId: string) => void;
  onChange: (patch: ParticipantPatch) => void;
  onRemove: () => void;
  onConditionsChange: (conditions: ActiveCondition[]) => void;
}) {
  const t = useTranslations('combat');
  const theme = characterTheme(row.accentColor);

  return (
    <section
      aria-labelledby="combat-selected-name"
      style={{ ...theme.style, '--primary': 'var(--character-color)' } as CSSProperties}
      className={cn(
        theme.className,
        'bg-card/60 border-character-muted sticky top-4 flex flex-col gap-4 rounded-xl border p-4',
        row.isCurrent && 'border-primary',
      )}
    >
      <div className="flex items-center gap-3">
        <CharacterPortrait
          avatarUrl={row.avatarUrl}
          characterClass={row.class}
          className="size-14 shrink-0 rounded-lg"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {row.isCurrent && (
            <span className="text-label text-character-flare">{t('currentTurn')}</span>
          )}
          <h3 id="combat-selected-name" className="text-title text-character-flare break-words">
            {row.name}
          </h3>
          <OwnerOrSideBadge side={row.side} ownerUsername={row.ownerUsername} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="font-mono text-lg font-bold tabular-nums">
          <span className="sr-only">{t('hp')} </span>
          {`${row.hp.current} / ${row.hp.max}`}
          {row.hp.temp > 0 && <span className="text-warning-flare"> +{row.hp.temp}</span>}
        </span>
        <HealthBar
          current={row.hp.current}
          max={row.hp.max}
          temp={row.hp.temp}
          aria-hidden="true"
        />
      </div>

      <CombatRowDetails
        id={`combat-panel-${row.participantId}`}
        row={row}
        sheetHref={sheetHrefOf(partyId, row)}
        edition={edition}
        swapWith={swapWith}
        onSwap={onSwap}
        onChange={onChange}
        onRemove={onRemove}
        onConditionsChange={onConditionsChange}
      />
    </section>
  );
}
