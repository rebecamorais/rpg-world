'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

import { Button } from '@frontend/components/ui/button';
import { Card, CardContent } from '@frontend/components/ui/card';
import { EmptyState } from '@frontend/components/ui/empty-state';
import { useCurrentUser } from '@frontend/context/UserContext';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { PARTIES_QUERY_KEY } from '@frontend/lib/query-keys';

import type { InvitePreview, MemberStatus } from '@backend/contexts/parties/domain/Party';

/** The party behind an invite link, and the one action that fits where the person stands. */
export function JoinPartyCard({ code, invite }: { code: string; invite: InvitePreview | null }) {
  const t = useTranslations('parties.join');
  const tParties = useTranslations('parties');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();
  const { getErrorMessage } = useErrorMessage();
  const [status, setStatus] = useState(invite?.myStatus ?? null);
  const [isSending, setIsSending] = useState(false);

  if (!invite) {
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

  const send = async (request: () => Promise<MemberStatus>) => {
    setIsSending(true);
    try {
      const next = await request();
      // The party list (sidebar, /parties) shows the new invite or request status
      await queryClient.invalidateQueries({ queryKey: PARTIES_QUERY_KEY });
      if (next === 'active') router.push(`/parties/${invite.partyId}`);
      else setStatus(next);
    } catch (err) {
      toast.error(getErrorMessage(err));
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
      await rpgWorldApi.patch(`/api/parties/${invite.partyId}/members/${currentUser?.id}`);
      return 'active';
    });

  return (
    <Card className="w-full max-w-lg">
      <CardContent className="flex flex-col gap-4 p-6">
        <p className="text-heading">{invite.name}</p>
        {invite.gmUsername && (
          <p className="text-muted-foreground">{t('invitedBy', { username: invite.gmUsername })}</p>
        )}

        {status === 'requested' && (
          <p role="status" className="text-success-flare">
            {t('requested')}
          </p>
        )}
        {status === 'invited' && (
          <>
            <p>{t('alreadyInvited')}</p>
            <Button onClick={acceptInvite} loading={isSending} className="self-start">
              {tParties('accept')}
            </Button>
          </>
        )}
        {status === null && (
          <Button onClick={requestJoin} loading={isSending} className="self-start">
            {t('request')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
