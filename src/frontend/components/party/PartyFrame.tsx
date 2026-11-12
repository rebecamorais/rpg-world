'use client';

import type { ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import { useYourTurnToast } from '@frontend/components/combat/useYourTurnToast';
import { LoadingState } from '@frontend/components/shared/LoadingState';
import { PageContainer } from '@frontend/components/shared/PageContainer';
import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import AppLink from '@frontend/demo/AppLink';
import { useParty } from '@frontend/hooks/useParty';
import { usePartyChannel } from '@frontend/hooks/usePartyChannel';

import { MyPartyMenu, PartyNotFound } from './PartyPage';
import { PartyTabs } from './PartyTabs';
import { PartyLiveContext } from './partyLive';

/**
 * Frame of every party tab (Table, Combat, Journal, Chest): the party's name, the GM's way to
 * manage it or the player's own menu, the tabs, and the live channel that keeps them all fresh.
 * A player hears that their turn came on any tab.
 */
export function PartyFrame({ partyId, children }: { partyId: string; children: ReactNode }) {
  const t = useTranslations('parties');
  const { party, isLoading } = useParty(partyId);
  const { live } = usePartyChannel(partyId);
  useYourTurnToast(partyId);

  if (isLoading) return <LoadingState thematic />;
  if (!party) return <PartyNotFound />;

  return (
    <PageContainer
      title={party.name}
      eyebrow={party.role === 'gm' ? t('page.gmEyebrow') : t('page.playerEyebrow')}
      actions={
        party.role === 'gm' ? (
          <Button asChild variant="outline">
            <AppLink href={`/parties/${party.id}/settings`}>
              <AppIcon name="Settings2" size={18} aria-hidden="true" />
              {t('settings.manage')}
            </AppLink>
          </Button>
        ) : (
          <MyPartyMenu party={party} />
        )
      }
    >
      {/* Room at the bottom for the phone's tab bar */}
      <div className="flex flex-col gap-6 pb-20 md:pb-0">
        <PartyTabs partyId={party.id} />
        <PartyLiveContext.Provider value={live}>{children}</PartyLiveContext.Provider>
      </div>
    </PageContainer>
  );
}
