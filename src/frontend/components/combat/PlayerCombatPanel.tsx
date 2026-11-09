'use client';

import { useEffect, useRef } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { AppIcon } from '@frontend/components/ui/icon';
import { SectionCard } from '@frontend/components/ui/section-card';
import { useEncounter } from '@frontend/hooks/useEncounter';

import type { Edition } from '@shared/systems/dnd5e/content/editions';

import { CombatConnection } from './CombatConnection';
import { PlayerTurnRow } from './PlayerTurnRow';

/**
 * The combat as a player sees it: the round, the order with names only and whose turn it is.
 * No initiative, HP or AC of anyone (the API doesn't send them). They end only their own turn.
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
  const mine =
    encounter?.role === 'player'
      ? encounter.turns.find((turn) => turn.isCurrent && turn.isMine)
      : undefined;

  // The page may be scrolled down to the sheet: a toast says the turn came, once per turn
  const announced = useRef(mine?.participantId);
  useEffect(() => {
    if (mine && announced.current !== mine.participantId) {
      toast(t('yourTurnToast'), {
        icon: <AppIcon name="Swords" size={16} className="text-primary-flare" aria-hidden="true" />,
        // ! beats the Toaster's default border, which is more specific
        className: '!border-primary !shadow-[0_0_18px_var(--primary-glow)] font-display',
      });
    }
    announced.current = mine?.participantId;
  }, [mine, t]);

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
        {encounter.hiddenTurn && (
          <p role="status" className="text-muted-foreground">
            {t('gmTurn')}
          </p>
        )}
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
