'use client';

import { useEffect, useRef } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { AppIcon } from '@frontend/components/ui/icon';
import { useEncounter } from '@frontend/hooks/useEncounter';

/**
 * Tells a player their turn came, once per turn. Mounted by the party frame, so it reaches them
 * on any tab (the table, the journal, the chest), not only on the combat's.
 */
export function useYourTurnToast(partyId: string) {
  const t = useTranslations('combat');
  // The GM's view has no "mine": for them this never fires
  const { encounter } = useEncounter(partyId);
  const mine =
    encounter?.role === 'player'
      ? encounter.turns.find((turn) => turn.isCurrent && turn.isMine)
      : undefined;

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
}
