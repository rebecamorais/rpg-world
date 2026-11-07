'use client';

import { useEffect, useRef } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { ConditionBadge } from '@frontend/components/content/ConditionBadge';
import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { SectionCard } from '@frontend/components/ui/section-card';
import { useEncounter } from '@frontend/hooks/useEncounter';
import { cn } from '@frontend/lib/utils';

import type { Edition } from '@shared/systems/dnd5e/content/editions';

import { CombatConnection } from './CombatConnection';
import { ConditionsPicker } from './ConditionsPicker';

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
  const tCond = useTranslations('conditions');
  const { encounter, endTurn, setConditions } = useEncounter(partyId);
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
                    'border-border flex flex-col gap-2 rounded-md border px-3 py-2',
                    turn.isCurrent && 'border-primary bg-primary/10 animate-turn-glow',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(turn.isMine && 'font-semibold')}>{turn.name}</span>
                    {turn.isCurrent && (
                      <span className="text-label text-primary-flare">
                        {turn.isMine ? t('yourTurn') : t('currentTurn')}
                      </span>
                    )}
                  </div>
                  {(turn.conditions.length > 0 || turn.isMine) && (
                    // On touch screens the gap keeps each badge's touch area apart
                    <div className="flex flex-wrap items-center gap-2 pointer-coarse:gap-3">
                      {turn.conditions.map((condition) => (
                        <ConditionBadge
                          key={condition.key}
                          conditionKey={condition.key}
                          level={condition.level}
                          defaultEdition={edition}
                        />
                      ))}
                      {turn.isMine && (
                        <ConditionsPicker
                          value={turn.conditions}
                          defaultEdition={edition}
                          onChange={(conditions) =>
                            setConditions.mutate({ participantId: turn.participantId, conditions })
                          }
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={t('conditionsOf', { name: turn.name ?? '' })}
                            className="touch-target"
                          >
                            <AppIcon name="Activity" size={16} aria-hidden="true" />
                            {tCond('title')}
                          </Button>
                        </ConditionsPicker>
                      )}
                    </div>
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
