'use client';

import { useTranslations } from 'next-intl';

import { SectionCard } from '@frontend/components/ui/section-card';
import { useEncounter } from '@frontend/hooks/useEncounter';
import { cn } from '@frontend/lib/utils';

import type { Edition } from '@shared/systems/dnd5e/content/editions';

import { CombatConnection } from './CombatConnection';
import { PlayerTurnRow } from './PlayerTurnRow';

/**
 * The combat as a player sees it: the round, the order with names only and whose turn it is.
 * No initiative, HP or AC of anyone (the API doesn't send them). They end only their own turn.
 * The "your turn" toast comes from the party frame (useYourTurnToast), so it shows on every tab.
 */
export function PlayerCombatPanel({
  partyId,
  edition,
  live,
}: {
  partyId: string;
  edition: Edition;
  live: boolean;
}) {
  const t = useTranslations('combat');
  const { encounter, endTurn, setConditions, setMyInitiative } = useEncounter(partyId);

  if (encounter?.role !== 'player') return null;

  return (
    <SectionCard>
      <SectionCard.Header>
        <SectionCard.Title icon="Swords">
          {encounter.round === 0
            ? t('title')
            : `${t('title')} · ${t('round', { round: encounter.round })}`}
        </SectionCard.Title>
      </SectionCard.Header>
      <SectionCard.Body className="flex flex-col gap-4">
        <CombatConnection live={live} />
        {encounter.round === 0 && <p className="text-muted-foreground">{t('playerPreparing')}</p>}
        {/* Always mounted, so the message is announced when the GM's hidden turn starts */}
        <p
          role="status"
          className={cn('text-muted-foreground', !encounter.hiddenTurn && 'sr-only')}
        >
          {encounter.hiddenTurn && t('gmTurn')}
        </p>
        {/* While preparing, only the player's own rows: they can type their initiative already */}
        <ol aria-label={t('order')} className="flex flex-col gap-2">
          {(encounter.round === 0
            ? encounter.turns.filter((turn) => turn.isMine)
            : encounter.turns
          ).map((turn) => (
            <PlayerTurnRow
              key={turn.participantId}
              turn={turn}
              edition={edition}
              onConditionsChange={(conditions) =>
                setConditions.mutate({ participantId: turn.participantId, conditions })
              }
              onInitiativeChange={(initiative) =>
                setMyInitiative.mutate({ participantId: turn.participantId, initiative })
              }
              onEndTurn={() => endTurn.mutate(turn.participantId)}
              endingTurn={endTurn.isPending}
            />
          ))}
        </ol>
      </SectionCard.Body>
    </SectionCard>
  );
}
