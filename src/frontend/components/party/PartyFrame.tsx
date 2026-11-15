'use client';

import { type ReactNode, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { APIError } from '@client';

import { useYourTurnToast } from '@frontend/components/combat/useYourTurnToast';
import { LoadingState } from '@frontend/components/shared/LoadingState';
import { OfflineNotice } from '@frontend/components/shared/OfflineNotice';
import { PageContainer } from '@frontend/components/shared/PageContainer';
import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { useCurrentUser } from '@frontend/context/UserContext';
import AppLink from '@frontend/demo/AppLink';
import { useParty } from '@frontend/hooks/useParty';
import { usePartyChannel } from '@frontend/hooks/usePartyChannel';
import { partyQueryKey } from '@frontend/lib/query-keys';

import type { PartyRole } from '@backend/contexts/parties/domain/Party';

import { MyPartyMenu, PartyNotFound } from './PartyPage';
import { PartyTabs } from './PartyTabs';
import { PartyLiveContext } from './partyLive';

/** How soon after the person's own "leave" a "not found" counts as that leave, not a removal. */
const OWN_LEAVE_MS = 10_000;

/**
 * The party this page had open answering "not found": the GM removed the person, or the party was
 * deleted (both arrive as a "party" notice on the channel). They are told and taken to their
 * parties, instead of a party that silently stopped working. Leaving on purpose (My characters →
 * Leave party) ends in "not found" too, and that flow already says so and navigates.
 */
function useGoneFromParty(partyId: string, role: PartyRole | null, notFound: boolean) {
  const t = useTranslations('parties.page');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();
  // The role this page last saw: a party never opened (a stranger's link) stays "not found"
  const [seenRole, setSeenRole] = useState<PartyRole | null>(null);
  if (role && role !== seenRole) setSeenRole(role);
  const gone = notFound && seenRole !== null;

  useEffect(() => {
    if (!gone || !currentUser) return;
    const goneAt = queryClient.getQueryState(partyQueryKey(partyId))?.errorUpdatedAt ?? 0;
    // Their own leave: removing themselves (useParty's removeMember), just before the 404
    const leftOnPurpose =
      queryClient.getMutationCache().findAll({
        predicate: (m) =>
          m.state.variables === currentUser.id &&
          m.state.status !== 'error' &&
          goneAt - m.state.submittedAt < OWN_LEAVE_MS,
      }).length > 0;
    if (leftOnPurpose) return;
    // The id keeps it to one notice if the effect runs twice
    toast(t(seenRole === 'gm' ? 'deleted' : 'removed'), { id: `party-gone-${partyId}` });
    router.replace('/parties');
  }, [gone, seenRole, currentUser, partyId, queryClient, router, t]);

  return gone;
}

/**
 * Frame of every party tab (Table, Combat, Journal, Chest): the party's name, the GM's way to
 * manage it or the player's own menu, the tabs, and the live channel that keeps them all fresh.
 * A player hears that their turn came on any tab. Offline, a notice stays on screen on every tab
 * (Chest and Journal too, which have no "Reconnecting…" of their own).
 */
export function PartyFrame({ partyId, children }: { partyId: string; children: ReactNode }) {
  const t = useTranslations('parties');
  const { party, isLoading, error } = useParty(partyId);
  const { live } = usePartyChannel(partyId);
  useYourTurnToast(partyId);
  const gone = useGoneFromParty(
    partyId,
    party?.role ?? null,
    error instanceof APIError && error.status === 404,
  );

  // On the way to the party list
  if (isLoading || gone) return <LoadingState thematic />;
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
      <OfflineNotice />
      {/* Room at the bottom for the phone's tab bar */}
      <div className="flex flex-col gap-6 pb-20 md:pb-0">
        <PartyTabs partyId={party.id} />
        <PartyLiveContext.Provider value={live}>{children}</PartyLiveContext.Provider>
      </div>
    </PageContainer>
  );
}
