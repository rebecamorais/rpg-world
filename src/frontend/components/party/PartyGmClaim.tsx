'use client';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { SectionCard } from '@frontend/components/ui/section-card';
import { useCurrentUser } from '@frontend/context/UserContext';
import { useParties } from '@frontend/hooks/useParties';
import { useParty } from '@frontend/hooks/useParty';

import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

import { personName } from './PartyRequests';

// Same limit the database keeps (party_gm_limit); here it only explains the disabled button
const MAX_GM_PARTIES = 5;

/** A party without a GM: ask to become it, answer someone else's request, or call support. */
export function PartyGmClaim({ party }: { party: PartyView }) {
  const t = useTranslations('parties.gmClaim');
  const unnamed = useTranslations('parties.manage')('unnamed');
  const { currentUser } = useCurrentUser();
  const { parties } = useParties();
  const { claimGm, voteGmClaim, cancelGmClaim } = useParty(party.id);
  const claim = party.gmClaim;
  const isBusy = claimGm.isPending || voteGmClaim.isPending || cancelGmClaim.isPending;

  const people = new Map(party.people.map((person) => [person.userId, person]));
  const names = (userIds: string[]) =>
    userIds
      .map((id) => people.get(id))
      .filter((person) => !!person)
      .map((person) => personName(person, unnamed))
      .join(', ');

  const gmCount = parties?.asGm.length ?? 0;
  const atLimit = gmCount >= MAX_GM_PARTIES;

  // The only active player has nobody to wait for: the click makes them the GM on the spot
  const onlyPlayer =
    party.people.filter((person) => person.status === 'active').length === 1 &&
    party.people.some((person) => person.userId === currentUser?.id && person.status === 'active');

  const onClaim = () => {
    if (window.confirm(t(onlyPlayer ? 'claimConfirmSolo' : 'claimConfirm'))) claimGm.mutate();
  };

  const isCandidate = claim?.candidateId === currentUser?.id;
  const mustAnswer = !!claim && !!currentUser && claim.pendingUserIds.includes(currentUser.id);

  return (
    <SectionCard>
      <SectionCard.Header>
        <SectionCard.Title icon="Shield">{t('title')}</SectionCard.Title>
      </SectionCard.Header>
      <SectionCard.Body className="flex flex-col gap-4">
        <p className="text-muted-foreground">{t('description')}</p>

        {!claim && (
          <>
            <p>{t(onlyPlayer ? 'claimHintSolo' : 'claimHint')}</p>
            {atLimit && (
              <p id="gm-claim-limit" className="text-warning-flare">
                {t('limit', { max: MAX_GM_PARTIES })}
              </p>
            )}
            <Button
              onClick={onClaim}
              loading={claimGm.isPending}
              disabled={atLimit || isBusy}
              aria-describedby={atLimit ? 'gm-claim-limit' : undefined}
              className="self-start"
            >
              {t('claim')}
            </Button>
          </>
        )}

        {claim && isCandidate && (
          <>
            <p>{t('yourRequest')}</p>
            <p className="text-muted-foreground">
              {t('waitingOn', { names: names(claim.pendingUserIds) })}
            </p>
            <Button
              variant="ghost"
              onClick={() => cancelGmClaim.mutate()}
              loading={cancelGmClaim.isPending}
              disabled={isBusy}
              className="self-start"
            >
              {t('cancel')}
            </Button>
          </>
        )}

        {claim && !isCandidate && (
          <>
            <p>
              {t('askedBy', {
                name: claim.candidateUsername ? `@${claim.candidateUsername}` : unnamed,
              })}
            </p>
            {mustAnswer ? (
              <>
                <p className="text-warning-flare">{t('sheetWarning')}</p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => voteGmClaim.mutate(false)}
                    disabled={isBusy}
                    // Both buttons send the same mutation: the spinner goes on the one clicked
                    loading={voteGmClaim.isPending && voteGmClaim.variables === false}
                  >
                    {t('decline')}
                  </Button>
                  <Button
                    onClick={() => voteGmClaim.mutate(true)}
                    disabled={isBusy}
                    loading={voteGmClaim.isPending && voteGmClaim.variables === true}
                  >
                    {t('accept')}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p role="status" className="text-success-flare">
                  {t('youAccepted')}
                </p>
                <p className="text-muted-foreground">
                  {t('waitingOn', { names: names(claim.pendingUserIds) })}
                </p>
              </>
            )}
          </>
        )}

        {claim && (
          <div className="flex flex-col items-start gap-2">
            {claim.canAskSupport ? (
              <>
                <Button asChild variant="outline">
                  <Link href={`/support?party=${party.id}`}>{t('askSupport')}</Link>
                </Button>
                <p className="text-label text-muted-foreground">{t('supportHint')}</p>
              </>
            ) : (
              <>
                <Button variant="outline" disabled aria-describedby="gm-claim-support">
                  {t('askSupport')}
                </Button>
                <p id="gm-claim-support" className="text-label text-muted-foreground">
                  {t('supportLater')}
                </p>
              </>
            )}
          </div>
        )}
      </SectionCard.Body>
    </SectionCard>
  );
}
