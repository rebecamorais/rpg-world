'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { APIError, rpgWorldApi } from '@client';

import { Button } from '@frontend/components/ui/button';
import { Card, CardContent } from '@frontend/components/ui/card';
import { useConfirm } from '@frontend/components/ui/confirm-dialog';
import { EmptyState } from '@frontend/components/ui/empty-state';
import { useCurrentUser } from '@frontend/context/UserContext';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { PARTIES_QUERY_KEY, partyInviteQueryKey } from '@frontend/lib/query-keys';

import type { InvitePreview, MemberStatus } from '@backend/contexts/parties/domain/Party';

/** Same pace as the party without a GM (useParty): a request waits for a person, not a timer. */
export const INVITE_POLL_MS = 20_000;

/** The link no longer leads anywhere: the GM changed it, or the party was deleted. */
const isGone = (error: unknown) => error instanceof APIError && error.status === 404;

/**
 * The party behind an invite link, and the one action that fits where the person stands. While a
 * request waits, the page asks again every 20 s: whoever asked isn't a member yet, so the party's
 * private channel won't let them listen. Approved, it opens the party; declined, it says so. The
 * request can be withdrawn here too, where the person waits.
 */
export function JoinPartyCard({ code, invite }: { code: string; invite: InvitePreview | null }) {
  const t = useTranslations('parties.join');
  const tParties = useTranslations('parties');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();
  const { getErrorMessage } = useErrorMessage();
  const confirm = useConfirm();
  const [isSending, setIsSending] = useState(false);
  const queryKey = partyInviteQueryKey(code);

  // The server's preview is the first answer; only a pending request asks again
  const { data, error, refetch } = useQuery({
    queryKey,
    queryFn: () => rpgWorldApi.get<InvitePreview>(`/api/parties/join/${code}`),
    initialData: invite ?? undefined,
    staleTime: INVITE_POLL_MS,
    // Dropped on leaving the page: coming back starts from the server's fresh preview again
    gcTime: 0,
    enabled: !!invite,
    retry: false,
    // A link that's gone (the GM changed it, the request went with it) stops asking: nothing would
    // answer it any more. Any other failure tries again on the next round.
    refetchInterval: (q) =>
      !isGone(q.state.error) && q.state.data?.myStatus === 'requested' ? INVITE_POLL_MS : false,
  });
  // The latest answer: the GM may have changed while the request waited
  const shown = data ?? invite;
  const status = shown?.myStatus ?? null;
  const partyId = invite?.partyId;

  // Approved while the page was open: straight to the party, as the server page does on a reload
  useEffect(() => {
    if (status !== 'active' || !partyId) return;
    toast.success(t('approved'), { id: `party-approved-${partyId}` });
    void queryClient.invalidateQueries({ queryKey: PARTIES_QUERY_KEY });
    router.push(`/parties/${partyId}`);
  }, [status, partyId, queryClient, router, t]);

  if (!shown || isGone(error)) {
    return (
      <EmptyState
        icon="Mailbox"
        title={t('invalidTitle')}
        description={t('invalidDescription')}
        className="w-full max-w-lg"
        action={
          <Link href="/parties" className="text-primary-flare text-sm underline">
            {t('goToParties')}
          </Link>
        }
      />
    );
  }

  /** Sends an answer and shows where the person stands after it (null: no request any more). */
  const send = async (request: () => Promise<MemberStatus | null>, done?: string) => {
    setIsSending(true);
    try {
      const next = await request();
      // The party list (sidebar, /parties) shows the new invite or request status
      await queryClient.invalidateQueries({ queryKey: PARTIES_QUERY_KEY });
      if (next === 'active') router.push(`/parties/${shown.partyId}`);
      // On the cache as it is now: a poll may have brought news while the request went
      else
        queryClient.setQueryData<InvitePreview>(queryKey, (prev) => ({
          ...(prev ?? shown),
          myStatus: next,
        }));
      if (done) toast.success(done);
    } catch (err) {
      // The link changed (or the party went) while the page was open: asking again shows where
      // things stand, the "no longer valid" state when the link itself is gone
      if (isGone(err)) await refetch();
      else toast.error(getErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  };

  const requestJoin = () =>
    send(
      async () =>
        (await rpgWorldApi.post<{ status: MemberStatus }>(`/api/parties/join/${code}`)).status,
    );
  const acceptInvite = () =>
    send(async () => {
      await rpgWorldApi.patch(`/api/parties/${shown.partyId}/members/${currentUser?.id}`);
      return 'active';
    });
  const withdraw = async () => {
    const ok = await confirm({
      title: tParties('withdrawTitle'),
      description: tParties('withdrawConfirm', { name: shown.name }),
      confirmLabel: tParties('withdraw'),
      destructive: true,
    });
    if (!ok) return;
    await send(
      async () => {
        await rpgWorldApi.delete(`/api/parties/${shown.partyId}/members/${currentUser?.id}`);
        return null;
      },
      tParties('requestWithdrawn', { name: shown.name }),
    );
  };

  return (
    <Card className="w-full max-w-lg">
      <CardContent className="flex flex-col gap-4 p-6">
        <h2 className="text-title">{shown.name}</h2>
        {shown.gmUsername && (
          <p className="text-muted-foreground">{t('invitedBy', { username: shown.gmUsername })}</p>
        )}

        {status === 'requested' && (
          <>
            <p role="status" className="text-success-flare">
              {t('requested')}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="destructive-ghost" onClick={withdraw} loading={isSending}>
                {tParties('withdraw')}
              </Button>
              <Button asChild variant="outline">
                <Link href="/parties">{t('goToParties')}</Link>
              </Button>
            </div>
          </>
        )}
        {/* Only that it was declined: who did it isn't stored */}
        {status === 'declined' && shown.hasGm && (
          <p role="status" className="text-warning-flare">
            {t('declined')}
          </p>
        )}
        {!shown.hasGm && (
          <p role="status" className="text-warning-flare">
            {t('withoutGm')}
          </p>
        )}
        {status === 'invited' && shown.hasGm && (
          <>
            <p>{t('alreadyInvited')}</p>
            <Button onClick={acceptInvite} loading={isSending} className="self-start">
              {tParties('accept')}
            </Button>
          </>
        )}
        {(status === null || status === 'declined') && shown.hasGm && (
          <Button onClick={requestJoin} loading={isSending} className="self-start">
            {status === 'declined' ? t('requestAgain') : t('request')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
