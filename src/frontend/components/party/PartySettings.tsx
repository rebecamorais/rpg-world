'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { LoadingState } from '@frontend/components/shared/LoadingState';
import { PageContainer } from '@frontend/components/shared/PageContainer';
import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import AppLink from '@frontend/demo/AppLink';
import { useParty } from '@frontend/hooks/useParty';

import { JournalSettings } from './JournalSettings';
import { PartyDangerZone } from './PartyDangerZone';
import { PartyImageSettings } from './PartyImageSettings';
import { PartyManagement } from './PartyManagement';
import { PartyNotFound } from './PartyPage';

/** The GM's party settings, apart from the table: invite, players, name, picture and journal. */
export function PartySettings({ partyId }: { partyId: string }) {
  const t = useTranslations('parties.settings');
  const router = useRouter();
  const { party, isLoading } = useParty(partyId);
  // A player at this table already knows it exists: "not found" read like a bug, so they go to
  // the table and are told why. Strangers still get "not found" (nothing to reveal).
  const notTheGm = !!party && party.role !== 'gm';

  useEffect(() => {
    if (!notTheGm) return;
    // The id keeps it to one notice if the effect runs twice
    toast(t('gmOnly'), { id: `party-settings-gm-only-${partyId}` });
    router.replace(`/parties/${partyId}`);
  }, [notTheGm, partyId, router, t]);

  if (isLoading || notTheGm) return <LoadingState thematic />;
  if (!party) return <PartyNotFound />;

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
      <div className="flex flex-col gap-6">
        <PartyManagement party={party} />
        <PartyImageSettings party={party} />
        <JournalSettings party={party} />
        <PartyDangerZone party={party} onDeleted={() => router.push('/parties')} />
      </div>
    </PageContainer>
  );
}
