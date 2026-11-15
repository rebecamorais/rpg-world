'use client';

import { useTranslations } from 'next-intl';

import { ItemList } from '@frontend/components/character/inventory/Backpack';
import { CoinPurse } from '@frontend/components/character/inventory/CoinPouch';
import { LoadingState } from '@frontend/components/shared/LoadingState';
import { PageContainer } from '@frontend/components/shared/PageContainer';
import { usePartyChest } from '@frontend/hooks/useInventory';
import { INVENTORY_VIEW_KEYS } from '@frontend/hooks/useInventoryView';
import { useParty } from '@frontend/hooks/useParty';

import { PartyNotFound } from './PartyPage';

/** The party chest: its coins and items, for the GM and the players alike. */
export function PartyChest({ partyId }: { partyId: string }) {
  const t = useTranslations('parties.chest');
  const chest = usePartyChest(partyId);

  return (
    <div className="flex flex-col gap-6">
      {/* In plain sight, not only behind the titles' hint: what changes here changes for everyone */}
      <p className="text-caption text-muted-foreground">{t('shared')}</p>
      <CoinPurse
        inventory={chest}
        title={t('coinsTitle')}
        hint={t('coinsHint')}
        dialogText={{
          receiveDescription: t('coinsReceiveDescription'),
          after: t('coinsAfter'),
          tooMany: (max) => t('coinsTooMany', { max }),
        }}
      />
      <ItemList
        inventory={chest}
        viewKey={INVENTORY_VIEW_KEYS.chest}
        icon="Backpack"
        title={t('itemsTitle')}
        hint={t('itemsHint')}
        empty={t('empty')}
        emptyHint={t('emptyHint')}
      />
    </div>
  );
}

/** The demo's chest, on its own page. The app's chest is a tab of the party frame. */
export function PartyChestPage({ partyId }: { partyId: string }) {
  const t = useTranslations('parties.chest');
  const { party, isLoading } = useParty(partyId);

  if (isLoading) return <LoadingState thematic />;
  if (!party) return <PartyNotFound />;

  return (
    <PageContainer title={party.name} eyebrow={t('title')}>
      <PartyChest partyId={partyId} />
    </PageContainer>
  );
}
