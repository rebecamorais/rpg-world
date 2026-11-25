'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { LoadingState } from '@frontend/components/shared/LoadingState';
import { Button } from '@frontend/components/ui/button';
import { Card } from '@frontend/components/ui/card';
import { useConfirm } from '@frontend/components/ui/confirm-dialog';
import { ErrorState } from '@frontend/components/ui/empty-state';
import { AppIcon } from '@frontend/components/ui/icon';
import { useCurrentUser } from '@frontend/context/UserContext';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { neighbours, useFocusAfterRemove } from '@frontend/hooks/useFocusAfterRemove';
import { useParties } from '@frontend/hooks/useParties';
import { cn } from '@frontend/lib/utils';

import type { PartySummary } from '@backend/contexts/parties/domain/Party';

import { CreatePartyForm } from './CreatePartyForm';

// Where the focus goes when the last invite or request leaves: the section after them
const AS_GM_FOCUS = 'as-gm';

function Section({
  title,
  focusKey,
  children,
}: {
  title: string;
  /** Lets the focus land on the heading (see `useFocusAfterRemove`). */
  focusKey?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h2
        className="text-label text-muted-foreground outline-none"
        data-focus-key={focusKey}
        tabIndex={focusKey ? -1 : undefined}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

// Two lines before it is cut, the whole name in the tooltip
const NAME_CLASS = 'text-title line-clamp-2 break-normal hyphens-auto';

/**
 * One party: its name and what to know about it on the left, the arrow on the right, and the
 * buttons (invites, requests) always on a line of their own, so rows line up whatever the name.
 */
function PartyRow({
  party,
  note,
  children,
}: {
  party: PartySummary;
  /** A line under the name, such as why the person is waiting. */
  note?: string;
  children?: React.ReactNode;
}) {
  const t = useTranslations('parties');
  const canOpen = party.status === 'active' || party.status === 'gm';

  return (
    <Card
      className={cn(
        'bg-card/60 relative flex flex-col gap-3 px-4 py-3',
        canOpen && 'hover:border-primary/60 transition-colors',
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {canOpen ? (
            // The whole card opens the party; the buttons of invites and requests stay above it
            <Link
              href={`/parties/${party.id}`}
              title={party.name}
              className={cn(NAME_CLASS, 'focus-ring rounded after:absolute after:inset-0')}
            >
              {party.name}
            </Link>
          ) : (
            <span title={party.name} className={NAME_CLASS}>
              {party.name}
            </span>
          )}
          {!party.hasGm && <span className="text-label text-warning-flare">{t('noGm')}</span>}
          {/* Usernames in their own case: they are case-sensitive */}
          {party.gmUsername && party.role === 'player' && (
            <span className="text-caption text-muted-foreground">
              {t('gmBy', { username: party.gmUsername })}
            </span>
          )}
          {party.role === 'gm' && (
            <span className="text-caption text-muted-foreground">
              {t('players', { count: party.activePlayers })}
            </span>
          )}
          {note && <span className="text-caption text-muted-foreground">{note}</span>}
          {party.pendingRequests > 0 && (
            <span className="text-label text-warning-flare flex items-center gap-1.5">
              <span className="bg-warning h-2 w-2 rounded-full" aria-hidden="true" />
              {t('pendingRequests', { count: party.pendingRequests })}
            </span>
          )}
        </div>
        {canOpen && (
          <AppIcon
            name="ChevronRight"
            size={18}
            aria-hidden="true"
            className="text-muted-foreground shrink-0"
          />
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </Card>
  );
}

/**
 * The parties page: what waits on an answer first (invitations to answer, then the person's own
 * requests), then GM and player tables, then a new one.
 */
export default function PartyList() {
  const t = useTranslations('parties');
  const confirm = useConfirm();
  const { getErrorMessage } = useErrorMessage();
  const { parties, isLoading, error, respondAsync, respondingTo } = useParties({ poll: true });
  const { currentUser } = useCurrentUser();
  const router = useRouter();
  const userId = currentUser?.id ?? '';
  // The answered row leaves with the button the confirmation gave the focus back to
  const { root: focusRoot, next: focusNext, cancel: focusCancel } = useFocusAfterRemove();

  // Accepting goes into the party, as the invite page does: it's the next thing to do there
  const accept = async (party: PartySummary) => {
    try {
      await respondAsync({ partyId: party.id, userId, accept: true });
    } catch {
      return; // useParties already shows the error
    }
    toast.success(t('joinedParty', { name: party.name }));
    router.push(`/parties/${party.id}`);
  };
  // Declining or withdrawing: the row just leaves, so a toast says it was done
  const leave = async (party: PartySummary, done: string, focusTargets: string[]) => {
    focusNext(party.id, focusTargets);
    try {
      await respondAsync({ partyId: party.id, userId, accept: false });
    } catch {
      focusCancel(); // the row stays, and so does the focus
      return; // useParties already shows the error
    }
    toast.success(done);
  };

  if (error) return <ErrorState title={t('loadErrorTitle')} description={getErrorMessage(error)} />;
  if (isLoading || !parties) return <LoadingState thematic />;

  const inviteIds = parties.invites.map((p) => p.id);
  const requestIds = parties.requests.map((p) => p.id);

  return (
    <div ref={focusRoot} className="flex flex-col gap-8">
      {parties.invites.length > 0 && (
        <Section title={t('invites')}>
          {parties.invites.map((party) => {
            const answer = respondingTo(party.id);
            return (
              <PartyRow key={party.id} party={party}>
                {/* Every row has the same buttons: the label names the party they answer */}
                <Button
                  size="sm"
                  variant="destructive-ghost"
                  disabled={!!answer}
                  loading={answer === 'decline'}
                  aria-label={t('declineInvite', { name: party.name })}
                  data-focus-key={party.id}
                  onClick={async () => {
                    const ok = await confirm({
                      title: t('declineInviteTitle'),
                      description: t('declineInviteConfirm', { name: party.name }),
                      confirmLabel: t('decline'),
                      destructive: true,
                    });
                    if (ok) {
                      leave(
                        party,
                        t('inviteDeclined', { name: party.name }),
                        neighbours(inviteIds, party.id, requestIds[0], AS_GM_FOCUS),
                      );
                    }
                  }}
                >
                  {t('decline')}
                </Button>
                {/* Nobody joins a party without a GM: accepting would always fail */}
                {party.hasGm ? (
                  <Button
                    size="sm"
                    disabled={!!answer}
                    loading={answer === 'accept'}
                    aria-label={t('acceptInvite', { name: party.name })}
                    onClick={() => accept(party)}
                  >
                    <AppIcon name="Check" size={16} aria-hidden="true" />
                    {t('accept')}
                  </Button>
                ) : (
                  <span className="text-caption text-muted-foreground">{t('noGmInviteHint')}</span>
                )}
              </PartyRow>
            );
          })}
        </Section>
      )}

      {parties.requests.length > 0 && (
        <Section title={t('requests')}>
          {parties.requests.map((party) => (
            <PartyRow key={party.id} party={party} note={t('requestWaiting')}>
              <Button
                size="sm"
                variant="destructive-ghost"
                loading={!!respondingTo(party.id)}
                aria-label={t('withdrawFrom', { name: party.name })}
                data-focus-key={party.id}
                onClick={async () => {
                  const ok = await confirm({
                    title: t('withdrawTitle'),
                    description: t('withdrawConfirm', { name: party.name }),
                    confirmLabel: t('withdraw'),
                    destructive: true,
                  });
                  if (ok) {
                    leave(
                      party,
                      t('requestWithdrawn', { name: party.name }),
                      neighbours(requestIds, party.id, inviteIds.at(-1), AS_GM_FOCUS),
                    );
                  }
                }}
              >
                {t('withdraw')}
              </Button>
            </PartyRow>
          ))}
        </Section>
      )}

      <Section title={t('asGm')} focusKey={AS_GM_FOCUS}>
        {parties.asGm.length === 0 && <p className="text-muted-foreground">{t('emptyGm')}</p>}
        {parties.asGm.map((party) => (
          <PartyRow key={party.id} party={party} />
        ))}
      </Section>

      <Section title={t('asPlayer')}>
        {parties.asPlayer.length === 0 && (
          <p className="text-muted-foreground">{t('emptyPlayer')}</p>
        )}
        {parties.asPlayer.map((party) => (
          <PartyRow key={party.id} party={party} />
        ))}
      </Section>

      <Section title={t('create.title')}>
        <CreatePartyForm gmCount={parties.asGm.length} />
      </Section>
    </div>
  );
}
