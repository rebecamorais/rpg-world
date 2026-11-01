'use client';

import { useEffect, useRef } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@frontend/components/ui/button';
import { SectionCard } from '@frontend/components/ui/section-card';
import { useEncounter } from '@frontend/hooks/useEncounter';
import { cn } from '@frontend/lib/utils';

import { CombatConnection } from './CombatConnection';

/**
 * The combat as a player sees it: the round, the order with names only and whose turn it is.
 * No initiative, HP or AC of anyone (the API doesn't send them). They end only their own turn.
 */
export function PlayerCombatPanel({ partyId, live }: { partyId: string; live: boolean }) {
  const t = useTranslations('combat');
  const { encounter, endTurn } = useEncounter(partyId);
  const mine =
    encounter?.role === 'player'
      ? encounter.turns.find((turn) => turn.isCurrent && turn.isMine)
      : undefined;

  // The page may be scrolled down to the sheet: a toast says the turn came, once per turn
  const announced = useRef(mine?.participantId);
  useEffect(() => {
    if (mine && announced.current !== mine.participantId) toast.info(t('yourTurnToast'));
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
        {encounter.round === 0 ? (
          <p className="text-muted-foreground">{t('playerPreparing')}</p>
        ) : (
          <>
            <ol aria-label={t('order')} className="flex flex-col gap-2">
              {encounter.turns.map((turn) => (
                <li
                  key={turn.participantId}
                  aria-current={turn.isCurrent ? 'true' : undefined}
                  className={cn(
                    'border-border flex items-center justify-between gap-2 rounded-md border px-3 py-2',
                    turn.isCurrent && 'border-primary bg-primary/10',
                  )}
                >
                  <span className={cn(turn.isMine && 'font-semibold')}>{turn.name}</span>
                  {turn.isCurrent && (
                    <span className="text-label text-primary-flare">
                      {turn.isMine ? t('yourTurn') : t('currentTurn')}
                    </span>
                  )}
                </li>
              ))}
            </ol>
            {mine && (
              <Button
                className="self-start"
                onClick={() => endTurn.mutate(mine.participantId)}
                loading={endTurn.isPending}
              >
                {t('endMyTurn')}
              </Button>
            )}
          </>
        )}
      </SectionCard.Body>
    </SectionCard>
  );
}
