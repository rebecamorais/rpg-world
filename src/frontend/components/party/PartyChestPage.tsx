'use client';

import { useTranslations } from 'next-intl';

import { ItemList } from '@frontend/components/character/inventory/Backpack';
import { CoinPurse } from '@frontend/components/character/inventory/CoinPouch';
import { LoadingState } from '@frontend/components/shared/LoadingState';
import { PageContainer } from '@frontend/components/shared/PageContainer';
import { usePartyChest } from '@frontend/hooks/useInventory';
import { useParty } from '@frontend/hooks/useParty';

import { PartyNotFound } from './PartyPage';

/** The party chest: its coins and items, for the GM and the players alike. */
export function PartyChestPage({ partyId }: { partyId: string }) {
  const t = useTranslations('parties.chest');
  const { party, isLoading } = useParty(partyId);
  const chest = usePartyChest(partyId);

  if (isLoading) return <LoadingState thematic />;
  if (!party) return <PartyNotFound />;

  return (
    <PageContainer title={party.name} eyebrow={t('title')}>
      <div className="flex flex-col gap-6">
        <CoinPurse inventory={chest} title={t('coinsTitle')} hint={t('coinsHint')} />
        <ItemList
          inventory={chest}
          icon="Backpack"
          title={t('itemsTitle')}
          hint={t('itemsHint')}
          empty={t('empty')}
          emptyHint={t('emptyHint')}
        />
      </div>
    </PageContainer>
  );
}
