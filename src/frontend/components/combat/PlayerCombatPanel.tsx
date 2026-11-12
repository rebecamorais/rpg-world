'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { SectionCard } from '@frontend/components/ui/section-card';
import { useEncounter } from '@frontend/hooks/useEncounter';
import { cn } from '@frontend/lib/utils';

import type { PlayerEncounterView } from '@backend/contexts/combat/domain/Encounter';

import type { Edition } from '@shared/systems/dnd5e/content/editions';

import { CombatConnection } from './CombatConnection';
import { PlayerTurnRow } from './PlayerTurnRow';
import { TurnBar } from './TurnBar';

type Turn = PlayerEncounterView['turns'][number];

/**
 * The player's next turn: which of their characters plays next, and in how many turns from now.
 * Null while it's theirs, before the combat starts, or while nobody visible has the turn.
 */
export function nextOwnTurn(turns: Turn[]): { name: string; count: number } | null {
  const index = turns.findIndex((turn) => turn.isCurrent);
  if (index < 0 || turns[index].isMine) return null;
  for (let step = 1; step < turns.length; step++) {
    const turn = turns[(index + step) % turns.length];
    if (turn.isMine && turn.life !== 'dead' && turn.name) return { name: turn.name, count: step };
  }
  return null;
}

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

  const started = encounter.round > 0;
  const mine = started ? encounter.turns.find((turn) => turn.isCurrent && turn.isMine) : undefined;
  const upcoming = started ? nextOwnTurn(encounter.turns) : null;

  return (
    // Phones: room under the list for the turn bar, above the tab bar
    <div className={cn('flex flex-col', (mine || upcoming) && 'pb-20 md:pb-0')}>
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
              />
            ))}
          </ol>
        </SectionCard.Body>
      </SectionCard>

      {/* Their turn: the button to end it, in reach. Otherwise, how long until it comes */}
      {mine ? (
        <TurnBar>
          <Button
            size="lg"
            className="w-full"
            onClick={() => endTurn.mutate(mine.participantId)}
            loading={endTurn.isPending}
          >
            {t('endTurnOf', { name: mine.name ?? '' })}
          </Button>
        </TurnBar>
      ) : (
        upcoming && (
          <TurnBar>
            <p className="text-muted-foreground min-w-0 flex-1 truncate text-sm">
              {t.rich('turnsUntil', {
                name: upcoming.name,
                count: upcoming.count,
                strong: (chunks) => <span className="text-foreground font-semibold">{chunks}</span>,
              })}
            </p>
          </TurnBar>
        )
      )}
    </div>
  );
}
