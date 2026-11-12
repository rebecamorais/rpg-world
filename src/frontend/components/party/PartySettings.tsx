'use client';

import { useRouter } from 'next/navigation';

import { useTranslations } from 'next-intl';

import { LoadingState } from '@frontend/components/shared/LoadingState';
import { PageContainer } from '@frontend/components/shared/PageContainer';
import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import AppLink from '@frontend/demo/AppLink';
import { useParty } from '@frontend/hooks/useParty';

import { JournalSettings } from './JournalSettings';
import { PartyImageSettings } from './PartyImageSettings';
import { PartyManagement } from './PartyManagement';
import { PartyNotFound } from './PartyPage';

/** The GM's party settings, apart from the table: invite, players, name, picture and journal. */
export function PartySettings({ partyId }: { partyId: string }) {
  const t = useTranslations('parties.settings');
  const router = useRouter();
  const { party, isLoading } = useParty(partyId);

  if (isLoading) return <LoadingState thematic />;
  if (party?.role !== 'gm') return <PartyNotFound />;

  return (
    <PageContainer
      title={party.name}
      eyebrow={t('eyebrow')}
      actions={
        <Button asChild variant="outline">
          <AppLink href={`/parties/${party.id}`}>
            <AppIcon name="ChevronLeft" size={18} aria-hidden="true" />
            {t('backToTable')}
          </AppLink>
        </Button>
      }
    >
      <PartyManagement party={party} onDeleted={() => router.push('/parties')} />
      <PartyImageSettings party={party} />
      <JournalSettings party={party} />
    </PageContainer>
  );
}
